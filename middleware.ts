import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Embedded browser user-agent patterns that block Google OAuth
const EMBEDDED_BROWSER_PATTERNS = [
  "LinkedInApp",
  "Instagram",
  "FBAN",   // Facebook app
  "FBAV",   // Facebook app variant
  "TikTok",
  "Slack",
];

// Routes that require authentication
const AUTH_PROTECTED_PREFIXES = [
  "/new",
  "/packs",
  "/billing",
  "/settings",
  "/history",
  "/calendar",
  "/repurpose",
];

function isEmbeddedBrowser(ua: string): boolean {
  return EMBEDDED_BROWSER_PATTERNS.some((pattern) => ua.includes(pattern));
}

function requiresAuth(pathname: string): boolean {
  return AUTH_PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const ua = request.headers.get("user-agent") ?? "";

  // 1. Embedded browser guard — redirect before anything else runs
  //    Skip if already on the fallback page to prevent redirect loops.
  if (pathname !== "/open-in-browser" && isEmbeddedBrowser(ua)) {
    const destination = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/open-in-browser?to=${destination}`, request.url)
    );
  }

  // 2. Auth guard — only run the async getToken for protected routes
  if (requiresAuth(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const callbackUrl = encodeURIComponent(pathname + search);
      return NextResponse.redirect(
        new URL(`/signin?callbackUrl=${callbackUrl}`, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *   - _next/static  (Next.js static assets)
     *   - _next/image   (Next.js image optimisation)
     *   - favicon.ico
     *   - /api/         (API routes)
     *   - public assets rooted at /images, /icons, etc.
     *
     * This allows the embedded-browser check to run on every
     * user-facing page while keeping asset requests fast.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};
