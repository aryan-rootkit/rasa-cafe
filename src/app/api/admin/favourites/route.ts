import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/auth/guard";
import { favouriteInputSchema, favouriteOrderSchema, firstIssue } from "@/lib/content/schema";
import { createFavourite, reorderFavourites } from "@/lib/content/store";
import { revalidatePublicPages } from "@/lib/revalidate";

export async function POST(request: NextRequest) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const parsed = favouriteInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const favourite = await createFavourite(parsed.data);
  revalidatePublicPages();
  return NextResponse.json({ favourite }, { status: 201 });
}

/** Saves the display order: `{ order: [id, id, …] }` listing every favourite once. */
export async function PUT(request: NextRequest) {
  const denied = await guardAdminApi(request);
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as { order?: unknown } | null;
  const parsed = favouriteOrderSchema.safeParse(body?.order);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const favourites = await reorderFavourites(parsed.data);
  if (!favourites) {
    return NextResponse.json(
      { error: "The favourites changed in another window. Reload the page and try again." },
      { status: 409 }
    );
  }
  revalidatePublicPages();
  return NextResponse.json({ favourites });
}
