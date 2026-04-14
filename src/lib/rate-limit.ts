import { NextRequest, NextResponse } from "next/server";

// Sliding-window in-memory rate limiter.
// Keyed by identifier (userId or IP). Each key stores an array of timestamps.

const store = new Map<string, number[]>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, timestamps] of store) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) store.delete(key);
    else store.set(key, filtered);
  }
}

/** Per-route limits (requests per window). Expensive AI routes get tight limits. */
const ROUTE_LIMITS: Record<string, number> = {
  "generate-recipes": 10,
  "generate-meal-plan": 10,
  "analyze-image": 20,
  "read-barcode": 30,
  barcode: 60,
  "health-score": 40,
  inventory: 100,
  carts: 80,
  sessions: 60,
  default: 120,
};

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getLimit(route: string): number {
  return ROUTE_LIMITS[route] ?? ROUTE_LIMITS["default"];
}

/**
 * Check rate limit. Returns null if OK, or a NextResponse 429 if exceeded.
 */
export function checkRateLimit(
  identifier: string,
  route: string
): NextResponse | null {
  cleanup(WINDOW_MS);

  const key = `${route}:${identifier}`;
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const limit = getLimit(route);

  const timestamps = (store.get(key) || []).filter((t) => t > cutoff);
  timestamps.push(now);
  store.set(key, timestamps);

  if (timestamps.length > limit) {
    const retryAfter = Math.ceil((timestamps[0] + WINDOW_MS - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  return null;
}

/**
 * Extract a rate-limit identifier from the request.
 * Uses userId if authenticated, otherwise falls back to IP.
 */
export function getRateLimitId(req: NextRequest, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}
