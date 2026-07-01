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
 *   /healthz, /sign-in, /sign-up, /login, /_next/*, favicon, static assets
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import {
  buildSignInPath,
  isAuthBypassPath,
  isPublicAssetPath,
} from "./lib/auth-routes";

const LEGACY_COOKIE_NAME = "qlv_session";

const isNextInternalRoute = createRouteMatcher(["/_next(.*)", "/favicon.ico"]);

/** True when Clerk is configured (env vars present). */
function isClerkEnabled(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !!process.env.CLERK_SECRET_KEY
  );
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname, search } = request.nextUrl;
  if (
    isAuthBypassPath(pathname) ||
    isPublicAssetPath(pathname) ||
    isNextInternalRoute(request)
  ) {
    return NextResponse.next();
  }

  if (isClerkEnabled()) {
    // Clerk mode: use Clerk's auth protection.
    // PR-1 protects web routes only; API JWT validation stays deferred to PR-3.
    const sessionAuth = await auth();
    if (sessionAuth.userId) {
      return NextResponse.next();
    }

    return NextResponse.redirect(
      new URL(buildSignInPath(`${pathname}${search ?? ""}`), request.nextUrl.origin),
    );
  }

  // Legacy mode: fall back to session cookie check.
  const hasLegacySession = request.cookies.get(LEGACY_COOKIE_NAME)?.value;

  if (hasLegacySession) {
    return NextResponse.next();
  }

  return NextResponse.redirect(
    new URL(buildSignInPath(`${pathname}${search ?? ""}`), request.nextUrl.origin),
  );
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|txt|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
