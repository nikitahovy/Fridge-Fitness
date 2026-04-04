import { NextRequest, NextResponse } from "next/server";

// ── Rate Limiter (in-memory, per-IP, resets on deploy) ──
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // requests per window

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60_000);

// ── Middleware ──
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  // Reject oversized request bodies (1MB limit)
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 1_048_576) {
    // Allow larger for upload routes (handled by upload validation)
    if (!pathname.includes("/upload")) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }
  }

  // Upload routes get a 6MB limit
  if (pathname.includes("/upload") && contentLength && parseInt(contentLength, 10) > 6_291_456) {
    return NextResponse.json(
      { error: "File too large. Max 5MB." },
      { status: 413 }
    );
  }

  // CORS: restrict API to same-origin
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const res = NextResponse.next();

  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost === host) {
      res.headers.set("Access-Control-Allow-Origin", origin);
    }
    // Allow cross-origin for upload routes (phone → desktop)
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
