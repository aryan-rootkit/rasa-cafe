import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/auth/guard";
import { MAX_UPLOAD_BYTES, saveUploadedImage, UploadError } from "@/lib/media";

export async function POST(request: NextRequest) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json(
      { error: "Images must be 4 MB or smaller." },
      { status: 413 }
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }

  try {
    const url = await saveUploadedImage(file);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Image upload failed", error);
    return NextResponse.json(
      { error: "Couldn't process that image. Try another file." },
      { status: 500 }
    );
  }
}
