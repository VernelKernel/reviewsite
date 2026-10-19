import { NextResponse } from "next/server";

const MAX_BYTES = 6_000_000;

function allowed(url: URL): boolean {
  return url.protocol === "https:" && (url.hostname === "steamstatic.com" || url.hostname.endsWith(".steamstatic.com"));
}

async function pull(url: URL, hops = 0): Promise<Response> {
  const response = await fetch(url, {
    redirect: "manual",
    headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8" },
  });
  if (response.status >= 300 && response.status < 400 && hops < 2) {
    const location = response.headers.get("location");
    if (!location) return response;
    const next = new URL(location, url);
    if (!allowed(next)) return response;
    return pull(next, hops + 1);
  }
  return response;
}

/** Same-origin stand-in for Steam cover art, so the game-list download can composite it. */
export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get("src");
  let target: URL;
  try {
    target = new URL(src ?? "");
  } catch {
    return NextResponse.json({ error: "Missing art." }, { status: 400 });
  }
  if (!allowed(target)) return NextResponse.json({ error: "Art host is not allowed." }, { status: 400 });

  try {
    const upstream = await pull(target);
    if (!upstream.ok) return NextResponse.json({ error: "Could not fetch the art." }, { status: 502 });
    const type = upstream.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!type.startsWith("image/")) return NextResponse.json({ error: "Not an image." }, { status: 415 });
    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) return NextResponse.json({ error: "Image is too large." }, { status: 413 });
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not fetch the art." }, { status: 502 });
  }
}
