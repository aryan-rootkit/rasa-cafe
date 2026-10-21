import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/auth/guard";
import { firstIssue, menuCategoryInputSchema } from "@/lib/content/schema";
import { createMenuCategory } from "@/lib/content/store";
import { revalidatePublicPages } from "@/lib/revalidate";

export async function POST(request: NextRequest) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const parsed = menuCategoryInputSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const category = await createMenuCategory(parsed.data.label);
  if (!category) {
    return NextResponse.json(
      { error: "A category with that name already exists." },
      { status: 409 }
    );
  }
  revalidatePublicPages();
  return NextResponse.json({ category }, { status: 201 });
}
