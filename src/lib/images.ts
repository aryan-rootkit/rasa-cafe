import "server-only";

import { GridFSBucket, MongoServerSelectionError, MongoNetworkError, ObjectId } from "mongodb";
import sharp from "sharp";
import { DatabaseNotConfiguredError, getDb } from "@/lib/db/mongodb";
import { checkUploadFile } from "@/lib/upload-rules";

export { MAX_UPLOAD_BYTES } from "@/lib/upload-rules";

/**
 * Uploaded images live in MongoDB GridFS (`fs.files` + `fs.chunks`) and are
 * served by /api/images/[id]. Files are immutable: replacing an image uploads
 * a new file, and files no saved content references are deleted.
 */

export type ImageSection = "hero" | "menu";
export type StoredImage = {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
};
type ImageMetadata = { contentType: string; section: ImageSection; originalName: string };

const IMAGE_URL = /^\/api\/images\/([a-f0-9]{24})$/;
const MAX_DIMENSION = 2400;
const ORPHAN_GRACE_MS = 60 * 60 * 1000;

export class UploadError extends Error {}

export const imageUrlFor = (id: string) => `/api/images/${id}`;

/** GridFS file id referenced by an image URL, or null for bundled `/images/...` photos. */
export function fileIdFromUrl(url: string): string | null {
  return IMAGE_URL.exec(url)?.[1] ?? null;
}

async function bucket() {
  return new GridFSBucket(await getDb());
}

/** A safe message for the admin; details go to the server log. */
export function describeImageError(error: unknown): string {
  if (error instanceof UploadError) return error.message;
  if (error instanceof DatabaseNotConfiguredError) return error.message;
  if (error instanceof MongoServerSelectionError || error instanceof MongoNetworkError) {
    return "Unable to connect to image storage. Please try again.";
  }
  return "Image upload failed. Please try again.";
}

/**
 * Validates the actual bytes (not just the declared MIME type), strips
 * metadata, fixes orientation, caps dimensions, re-encodes as WebP and
 * stores the result in GridFS.
 */
export async function saveUploadedImage(file: File, section: ImageSection): Promise<StoredImage> {
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
    throw new UploadError("Unsupported image format. Use JPG, PNG or WebP.");
  }

  const output = await sharp(input, { limitInputPixels: 50_000_000 })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const id = new ObjectId();
  const filename = `${section}-${id.toHexString()}.webp`;
  const metadata: ImageMetadata = {
    contentType: "image/webp",
    section,
    originalName: file.name.slice(0, 200),
  };

  const upload = (await bucket()).openUploadStreamWithId(id, filename, { metadata });
  await new Promise<void>((resolve, reject) => {
    upload.once("finish", () => resolve()).once("error", reject);
    upload.end(output);
  });

  return {
    id: id.toHexString(),
    url: imageUrlFor(id.toHexString()),
    filename,
    contentType: metadata.contentType,
    size: output.length,
  };
}

export async function openImage(id: string) {
  if (!/^[a-f0-9]{24}$/.test(id)) return null;
  const b = await bucket();
  const _id = new ObjectId(id);
  const file = await b.find({ _id }).next();
  if (!file) return null;
  const metadata = file.metadata as Partial<ImageMetadata> | undefined;
  return {
    length: file.length,
    contentType: metadata?.contentType ?? "image/webp",
    stream: () => b.openDownloadStream(_id),
  };
}

/** filename/contentType for GridFS files, keyed by id. */
export async function getImageFileInfo(ids: string[]) {
  const info = new Map<string, { filename: string; contentType: string }>();
  if (ids.length === 0) return info;
  const files = await (await bucket())
    .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } })
    .toArray();
  for (const f of files) {
    const metadata = f.metadata as Partial<ImageMetadata> | undefined;
    info.set(f._id.toHexString(), {
      filename: f.filename,
      contentType: metadata?.contentType ?? "image/webp",
    });
  }
  return info;
}

/**
 * Deletes GridFS files that aren't in `referenced`. Uploads from the last
 * hour are kept unless listed in `replaced`, so an image uploaded but not
 * saved yet isn't deleted underneath the admin.
 */
export async function pruneUnusedImages(
  referenced: Set<string>,
  replaced: string[] = []
): Promise<void> {
  const b = await bucket();
  const cutoff = new Date(Date.now() - ORPHAN_GRACE_MS);
  const replacedIds = replaced.filter((id) => !referenced.has(id)).map((id) => new ObjectId(id));

  const stale = await b
    .find({ $or: [{ uploadDate: { $lt: cutoff } }, { _id: { $in: replacedIds } }] })
    .project<{ _id: ObjectId }>({ _id: 1 })
    .toArray();

  await Promise.all(
    stale
      .filter((f) => !referenced.has(f._id.toHexString()))
      .map((f) => b.delete(f._id).catch(() => {}))
  );
}
