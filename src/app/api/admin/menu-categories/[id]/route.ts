import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/auth/guard";
import { firstIssue, menuCategoryInputSchema } from "@/lib/content/schema";
import { deleteMenuCategory, renameMenuCategory } from "@/lib/content/store";
import { revalidatePublicPages } from "@/lib/revalidate";

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/menu-categories/[id]">
) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const parsed = menuCategoryInputSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const result = await renameMenuCategory(id, parsed.data.label);
  if (result === "not-found") {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }
  if (result === "taken") {
    return NextResponse.json(
      { error: "A category with that name already exists." },
      { status: 409 }
    );
  }
  revalidatePublicPages();
  return NextResponse.json({ category: result });
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/menu-categories/[id]">
) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const result = await deleteMenuCategory(id);
  if (result === "not-found") {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }
  if (result === "in-use") {
    return NextResponse.json(
      { error: "Move or delete the items in this category first." },
      { status: 409 }
    );
  }
  revalidatePublicPages();
  return NextResponse.json({ ok: true });
}
