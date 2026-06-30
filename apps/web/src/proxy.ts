/**
 * Server-side route protection (Next.js 16 "proxy" convention).
 *
 * PR-1: Clerk Foundation — uses Clerk's clerkMiddleware() for route protection.
 *
 * AUTH MODE SWITCHING:
 *  - Clerk mode: When NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set, use Clerk
 *    session protection. Unauthenticated requests redirect to /sign-in.
 *  - Legacy mode: When Clerk env vars are absent, fall back to legacy
 *    session cookie. This keeps E2E tests and dev workflow working.
 *
 * IMPORTANT: This proxy protects WEB ROUTES ONLY. The separate NestJS API (port 3001)
 * must be protected by ClerkJwtGuard in PR-3. Do not assume this middleware
 * protects the API.
 *
 * Public routes (always accessible):
 *   /sign-in, /sign-up, /login, /_next/*, favicon, static assets
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const LEGACY_COOKIE_NAME = "qlv_session";

const PUBLIC_ROUTES = [
  "/login",
  "/sign-in",
  "/sign-up",
  "/_next",
  "/favicon.ico",
  "/health",
];

const isPublicRoute = createRouteMatcher(PUBLIC_ROUTES.map((r) => `${r}(.*)`));

/** True when Clerk is configured (env vars present). */
function isClerkEnabled(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !!process.env.CLERK_SECRET_KEY
  );
}

export default clerkMiddleware((auth, request: NextRequest) => {
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  if (isClerkEnabled()) {
    // Clerk mode: use Clerk's auth protection.
    // auth() returns an auth object with protect() — redirect to /sign-in if unauthenticated.
    const sessionAuth = auth() as { protect?: () => void };
    sessionAuth.protect?.();
    return NextResponse.next();
  }

  // Legacy mode: fall back to session cookie check.
  const { pathname, search } = request.nextUrl;
  const hasLegacySession = request.cookies.get(LEGACY_COOKIE_NAME)?.value;

  if (hasLegacySession) {
    return NextResponse.next();
  }

  const returnUrl = encodeURIComponent(pathname + (search ?? ""));
  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set("returnUrl", returnUrl);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
