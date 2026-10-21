import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/auth/guard";
import { favouriteInputSchema, firstIssue } from "@/lib/content/schema";
import { deleteFavourite, updateFavourite } from "@/lib/content/store";
import { revalidatePublicPages } from "@/lib/revalidate";

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/favourites/[id]">
) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const parsed = favouriteInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const favourite = await updateFavourite(id, parsed.data);
  if (!favourite) {
    return NextResponse.json({ error: "Favourite not found." }, { status: 404 });
  }
  revalidatePublicPages();
  return NextResponse.json({ favourite });
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/favourites/[id]">
) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!(await deleteFavourite(id))) {
    return NextResponse.json({ error: "Favourite not found." }, { status: 404 });
  }
  revalidatePublicPages();
  return NextResponse.json({ ok: true });
}
