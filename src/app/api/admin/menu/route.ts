import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/auth/guard";
import { firstIssue, menuItemInputSchema } from "@/lib/content/schema";
import { createMenuItem } from "@/lib/content/store";
import { revalidatePublicPages } from "@/lib/revalidate";

export async function POST(request: NextRequest) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const parsed = menuItemInputSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const item = await createMenuItem(parsed.data);
  revalidatePublicPages();
  return NextResponse.json({ item }, { status: 201 });
}
