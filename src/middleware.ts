import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Create Supabase client with cookie handling
  let supabaseResponse = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  // Public routes that don't need auth
  const isPublic = pathname.startsWith("/login")
    || pathname.startsWith("/signup")
    || pathname.startsWith("/auth")
    || pathname.startsWith("/upload") // QR phone upload
    || pathname.startsWith("/api");   // API routes handle their own auth

  if (!user && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and visiting login/signup, redirect to home
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // API body size limits
  if (pathname.startsWith("/api")) {
    const contentLength = req.headers.get("content-length");
    const isImageRoute = pathname.includes("/upload") || pathname.includes("/analyze-image");
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      const limit = isImageRoute ? 8_388_608 : 1_048_576;
      if (size > limit) {
        return NextResponse.json({ error: "Request body too large" }, { status: 413 });
      }
    }

    // CORS
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin) {
      const originHost = new URL(origin).host;
      if (originHost === host || pathname.includes("/upload") || pathname.includes("/sessions")) {
        supabaseResponse.headers.set("Access-Control-Allow-Origin", origin);
      }
      supabaseResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
      supabaseResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
