import { NextRequest, NextResponse } from "next/server";

/** Proxy Unsplash images through our domain to avoid CSP/CORS/hotlink issues */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !url.includes("unsplash.com")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "FridgeFitness/1.0" },
    });

    if (!res.ok) {
      return new Response(null, { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
