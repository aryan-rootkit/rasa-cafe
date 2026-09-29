import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession, guardAdminApi } from "@/lib/auth/guard";
import { deleteAdminUser } from "@/lib/content/store";

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/users/[id]">
) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  const session = await getAdminSession();
  if (session?.uid === id) {
    return NextResponse.json(
      { error: "You can't remove your own account." },
      { status: 400 }
    );
  }
  if (!(await deleteAdminUser(id))) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
