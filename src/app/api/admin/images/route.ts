import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/auth/guard";
import {
  describeImageError,
  MAX_UPLOAD_BYTES,
  saveUploadedImage,
  UploadError,
  type ImageSection,
} from "@/lib/images";

const SECTIONS: ImageSection[] = ["hero", "menu"];

/** Stores an image in GridFS. It's linked to a hero slot or menu item when that is saved. */
export async function POST(request: NextRequest) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json(
      { error: "Image is too large. Use an image under 4 MB." },
      { status: 413 }
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  const section = form?.get("section");
  if (!SECTIONS.includes(section as ImageSection)) {
    return NextResponse.json({ error: "Invalid image section." }, { status: 400 });
  }

  try {
    const image = await saveUploadedImage(file, section as ImageSection);
    return NextResponse.json({ image, url: image.url }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Image upload failed", error);
    return NextResponse.json({ error: describeImageError(error) }, { status: 503 });
  }
}
