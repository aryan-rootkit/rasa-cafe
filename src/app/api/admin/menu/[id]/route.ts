import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/auth/guard";
import { firstIssue, menuItemInputSchema } from "@/lib/content/schema";
import { deleteMenuItem, menuCategoryExists, updateMenuItem } from "@/lib/content/store";
import { revalidatePublicPages } from "@/lib/revalidate";

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/menu/[id]">
) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const parsed = menuItemInputSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  if (!(await menuCategoryExists(parsed.data.category))) {
    return NextResponse.json({ error: "That category no longer exists." }, { status: 400 });
  }

  const item = await updateMenuItem(id, parsed.data);
  if (!item) {
    return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
  }
  revalidatePublicPages();
  return NextResponse.json({ item });
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/menu/[id]">
) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!(await deleteMenuItem(id))) {
    return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
  }
  revalidatePublicPages();
  return NextResponse.json({ ok: true });
}
