import { NextRequest, NextResponse } from "next/server";

// Rate limiting disabled for now — in-memory maps don't work reliably
// on Vercel's serverless architecture. Will re-add with Redis/DB later.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Reject oversized request bodies
  const contentLength = req.headers.get("content-length");
  const isImageRoute = pathname.includes("/upload") || pathname.includes("/analyze-image");

  if (contentLength) {
    const size = parseInt(contentLength, 10);
    const limit = isImageRoute ? 8_388_608 : 1_048_576;
    if (size > limit) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }
  }

  // CORS
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const res = NextResponse.next();

  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost === host) {
      res.headers.set("Access-Control-Allow-Origin", origin);
    }
    if (pathname.includes("/upload") || pathname.includes("/sessions")) {
      res.headers.set("Access-Control-Allow-Origin", origin);
    }
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  }

  return res;
}

export const config = {
  matcher: "/api/:path*",
};
