/** What the server accepts; Vercel rejects request bodies over 4.5 MB. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
/** Largest photo the admin can pick; bigger-than-server files are shrunk in the browser first. */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPT_ATTRIBUTE = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

/** Returns an error message, or null if the file may be uploaded. */
export function checkUploadFile(file: File, maxBytes = MAX_UPLOAD_BYTES): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return "Only JPG, PNG and WebP images are allowed.";
  }
  if (file.size === 0) return "The file is empty.";
  if (file.size > maxBytes) {
    return `Images must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller.`;
  }
  return null;
}
