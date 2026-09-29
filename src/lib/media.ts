import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getReferencedMedia, STORAGE_DIR } from "@/lib/content/store";
import { checkUploadFile } from "@/lib/upload-rules";

export { MAX_UPLOAD_BYTES } from "@/lib/upload-rules";

const MEDIA_DIR = path.join(STORAGE_DIR, "uploads");
const MEDIA_NAME = /^[a-f0-9-]{36}\.webp$/;
const MAX_DIMENSION = 2400;
const ORPHAN_GRACE_MS = 60 * 60 * 1000;

export class UploadError extends Error {}

/**
 * Validates the actual bytes (not just the declared MIME type), strips
 * metadata, fixes orientation, caps dimensions and re-encodes as WebP.
 */
export async function saveUploadedImage(file: File): Promise<string> {
  const problem = checkUploadFile(file);
  if (problem) throw new UploadError(problem);

  const input = Buffer.from(await file.arrayBuffer());

  let format: string | undefined;
  try {
    format = (await sharp(input).metadata()).format;
  } catch {
    throw new UploadError("That file isn't a readable image.");
  }
  if (!format || !["jpeg", "png", "webp"].includes(format)) {
    throw new UploadError("Only JPG, PNG and WebP images are allowed.");
  }

  const output = await sharp(input, { limitInputPixels: 50_000_000 })
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  const name = `${randomUUID()}.webp`;
  await mkdir(MEDIA_DIR, { recursive: true });
  await writeFile(path.join(MEDIA_DIR, name), output);
  return `/media/${name}`;
}

export async function readMedia(name: string): Promise<Buffer | null> {
  if (!MEDIA_NAME.test(name)) return null;
  try {
    return await readFile(path.join(MEDIA_DIR, name));
  } catch {
    return null;
  }
}

/**
 * Removes uploads no saved content references. Recent files are kept so an
 * image uploaded but not yet saved in another tab isn't deleted underneath it.
 */
export async function pruneUnusedMedia(): Promise<void> {
  let files: string[];
  try {
    files = await readdir(MEDIA_DIR);
  } catch {
    return;
  }
  const referenced = await getReferencedMedia();
  const now = Date.now();

  await Promise.all(
    files
      .filter((name) => MEDIA_NAME.test(name) && !referenced.has(`/media/${name}`))
      .map(async (name) => {
        const filePath = path.join(MEDIA_DIR, name);
        const { mtimeMs } = await stat(filePath);
        if (now - mtimeMs > ORPHAN_GRACE_MS) await unlink(filePath).catch(() => {});
      })
  );
}
