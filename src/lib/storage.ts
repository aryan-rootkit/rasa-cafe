import "server-only";

import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, list, put } from "@vercel/blob";

/**
 * Key/value file storage. Uses Vercel Blob when a Blob store is connected
 * (Vercel's own disk is read-only and wiped on every deploy), otherwise the
 * local `storage/` folder.
 */

export class StorageConflictError extends Error {}

export class StorageNotConnectedError extends Error {
  constructor() {
    super(
      "Storage isn't connected to this deployment. In Vercel: Storage → create a Blob store (Private) → Connect Project with all environments ticked, then Deployments → Redeploy."
    );
  }
}

/** A message an admin can act on for a failed storage call. */
export function describeStorageError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof StorageNotConnectedError) return message;
  if (/public|private|access/i.test(message)) {
    return "Your Vercel Blob store must use Private access. Create a new Blob store with Private access, connect it to this project and redeploy.";
  }
  if (/token|unauthori[sz]ed|forbidden|store.*(not found|suspended)/i.test(message)) {
    return "Vercel Blob rejected the connection. Reconnect the Blob store to this project in Vercel's Storage tab and redeploy.";
  }
  return `Couldn't reach storage (${message}). Please try again.`;
}

export type StoredFile = { data: Buffer; version: string };
export type ListedFile = { key: string; uploadedAt: Date };

/**
 * Vercel names the token after the prefix chosen when connecting the store
 * (BLOB_READ_WRITE_TOKEN by default), so match any variable holding one.
 */
function findBlobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  return Object.entries(process.env).find(
    ([name, value]) => name.endsWith("READ_WRITE_TOKEN") && value?.startsWith("vercel_blob_rw_")
  )?.[1];
}

const blobToken = findBlobToken();
const useBlob = Boolean(blobToken || process.env.BLOB_STORE_ID);
const blobAuth = blobToken ? { token: blobToken } : {};

/** True where saving is possible: locally, or on Vercel with a Blob store connected. */
export const storageConnected = useBlob || !process.env.VERCEL;

const LOCAL_DIR = path.resolve(
  /*turbopackIgnore: true*/ process.env.STORAGE_DIR ?? path.join(process.cwd(), "storage")
);
const localPath = (key: string) => path.join(LOCAL_DIR, ...key.split("/"));

/** `fresh` skips the CDN cache; use it for files that get overwritten. */
export async function readFileFromStorage(
  key: string,
  { fresh = false } = {}
): Promise<StoredFile | null> {
  if (!storageConnected) return null;

  if (useBlob) {
    const result = await get(key, { ...blobAuth, access: "private", useCache: !fresh });
    if (!result || result.statusCode !== 200) return null;
    const data = Buffer.from(await new Response(result.stream).arrayBuffer());
    return { data, version: result.blob.etag };
  }

  try {
    const file = localPath(key);
    const [data, info] = await Promise.all([readFile(file), stat(file)]);
    return { data, version: String(info.mtimeMs) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/**
 * `expectedVersion` makes the write conditional: a version string must still
 * match, and null means the file must not exist yet. Throws
 * StorageConflictError if someone else wrote in between.
 */
export async function writeFileToStorage(
  key: string,
  data: Buffer | string,
  { contentType, expectedVersion }: { contentType: string; expectedVersion?: string | null }
): Promise<void> {
  if (!storageConnected) throw new StorageNotConnectedError();

  if (useBlob) {
    try {
      await put(key, data, {
        ...blobAuth,
        access: "private",
        contentType,
        addRandomSuffix: false,
        cacheControlMaxAge: 60,
        ...(expectedVersion
          ? { ifMatch: expectedVersion }
          : { allowOverwrite: expectedVersion === undefined }),
      });
    } catch (error) {
      const name = (error as Error).name;
      if (name === "BlobPreconditionFailedError") throw new StorageConflictError();
      if (expectedVersion === null && (await readFileFromStorage(key, { fresh: true }))) {
        throw new StorageConflictError();
      }
      throw error;
    }
    return;
  }

  const file = localPath(key);
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, data);
  await rename(tmp, file);
}

export async function deleteFileFromStorage(key: string): Promise<void> {
  if (!storageConnected) return;
  if (useBlob) {
    await del(key, blobAuth);
    return;
  }
  await unlink(localPath(key)).catch(() => {});
}

export async function listStorage(prefix: string): Promise<ListedFile[]> {
  if (!storageConnected) return [];

  if (useBlob) {
    const files: ListedFile[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ ...blobAuth, prefix, cursor });
      files.push(...page.blobs.map((b) => ({ key: b.pathname, uploadedAt: b.uploadedAt })));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return files;
  }

  const dir = localPath(prefix);
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  return Promise.all(
    names.map(async (name) => ({
      key: `${prefix}${name}`,
      uploadedAt: (await stat(path.join(dir, name))).mtime,
    }))
  );
}
