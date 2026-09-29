import { Readable } from "node:stream";
import { openImage } from "@/lib/images";

// Public, read-only: streams an uploaded image from GridFS. Files are
// immutable (a replaced image gets a new id), so they can be cached forever.
export async function GET(request: Request, ctx: RouteContext<"/api/images/[id]">) {
  const { id } = await ctx.params;

  let image: Awaited<ReturnType<typeof openImage>>;
  try {
    image = await openImage(id);
  } catch (error) {
    console.error("Image read failed", error);
    return new Response("Image temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (!image) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const etag = `"${id}"`;
  const headers = {
    "Content-Type": image.contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  };
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  const stream = Readable.toWeb(image.stream()) as ReadableStream<Uint8Array>;
  return new Response(stream, {
    headers: { ...headers, "Content-Length": String(image.length) },
  });
}
