import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const { pathname, search } = request.nextUrl;
    const callbackUrl = encodeURIComponent(pathname + search);
    return NextResponse.redirect(
      new URL(`/signin?callbackUrl=${callbackUrl}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/new/:path*",
    "/packs/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/history/:path*",
  ],
};
