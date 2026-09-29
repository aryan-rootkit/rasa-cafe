import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/auth/guard";
import { firstIssue, settingsInputSchema } from "@/lib/content/schema";
import { updateSettings } from "@/lib/content/store";
import { revalidatePublicPages } from "@/lib/revalidate";

export async function PUT(request: NextRequest) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const parsed = settingsInputSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const settings = await updateSettings(parsed.data);
  revalidatePublicPages();
  return NextResponse.json({ settings });
}
