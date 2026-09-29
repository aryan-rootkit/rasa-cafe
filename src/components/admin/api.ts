import { checkUploadFile, MAX_SOURCE_BYTES, MAX_UPLOAD_BYTES } from "@/lib/upload-rules";

export async function adminRequest<T>(
  url: string,
  init: { method: string; body?: unknown }
): Promise<T> {
  const isForm = init.body instanceof FormData;
  const res = await fetch(url, {
    method: init.method,
    headers: init.body && !isForm ? { "Content-Type": "application/json" } : undefined,
    body: isForm
      ? (init.body as FormData)
      : init.body !== undefined
        ? JSON.stringify(init.body)
        : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };

  if (res.status === 401) {
    window.location.assign("/admin/login");
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

/** Re-encodes large photos as a 2400px JPEG so they fit under the server's upload limit. */
async function shrinkImage(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("That file isn't a readable image.");

  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.9, 0.8, 0.7]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (blob && blob.size <= MAX_UPLOAD_BYTES) {
      return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    }
  }
  throw new Error("That image is too large. Try a smaller photo.");
}

/** Uploads to GridFS and returns the image URL to save on a hero slot or menu item. */
export async function uploadImage(original: File, section: "hero" | "menu"): Promise<string> {
  const problem = checkUploadFile(original, MAX_SOURCE_BYTES);
  if (problem) throw new Error(problem);
  const file = await shrinkImage(original);
  const form = new FormData();
  form.append("file", file);
  form.append("section", section);
  const { url } = await adminRequest<{ url: string }>("/api/admin/images", {
    method: "POST",
    body: form,
  });
  return url;
}
