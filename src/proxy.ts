import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const PUBLIC_PATHS = ["/login", "/signup", "/api/auth/signup", "/api/auth/login", "/api/auth/anonymous", "/api/auth/logout"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const authToken = req.cookies.get("auth_token")?.value;
  const anonToken = req.cookies.get("anon_token")?.value;

  // For API routes that require authentication
  if (pathname.startsWith("/api/")) {
    // /api/auth/me is allowed with either token
    if (pathname === "/api/auth/me") {
      if (!authToken) {
        return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
      }
    }

    // /api/chats and /api/uploads require at least one session (auth or anon)
    if (pathname.startsWith("/api/chats") || pathname.startsWith("/api/uploads")) {
      if (!authToken && !anonToken) {
        return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
      }
    }

    return NextResponse.next();
  }

  // For page routes — check auth
  if (authToken) {
    try {
      await jwtVerify(authToken, JWT_SECRET);

      // Redirect authenticated users away from auth pages
      if (pathname === "/login" || pathname === "/signup") {
        return NextResponse.redirect(new URL("/", req.url));
      }

      return NextResponse.next();
    } catch {
      // Invalid token — clear it and let through
    }
  }

  // Anonymous users can access main pages
  if (anonToken && pathname !== "/login" && pathname !== "/signup") {
    return NextResponse.next();
  }

  // No session at all — allow access but anonymous session will be created client-side
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
