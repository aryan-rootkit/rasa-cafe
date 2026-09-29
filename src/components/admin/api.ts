import { checkUploadFile } from "@/lib/upload-rules";

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

export async function uploadImage(file: File): Promise<string> {
  const problem = checkUploadFile(file);
  if (problem) throw new Error(problem);
  const form = new FormData();
  form.append("file", file);
  const { url } = await adminRequest<{ url: string }>("/api/admin/upload", {
    method: "POST",
    body: form,
  });
  return url;
}
