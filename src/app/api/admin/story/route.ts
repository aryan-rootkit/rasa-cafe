import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/auth/guard";
import { firstIssue, storyImagesInputSchema } from "@/lib/content/schema";
import { saveStoryImages } from "@/lib/content/store";
import { revalidatePublicPages } from "@/lib/revalidate";

export async function PUT(request: NextRequest) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as { images?: unknown } | null;
  const parsed = storyImagesInputSchema.safeParse(body?.images);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const images = await saveStoryImages(parsed.data);
  revalidatePublicPages();
  return NextResponse.json({ images });
}
