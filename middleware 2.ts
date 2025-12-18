import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

import { auth } from "@/auth";

function isApiRequest(pathname: string) {
  return pathname.startsWith("/api/");
}

function isAuthApi(pathname: string) {
  return pathname.startsWith("/api/auth/");
}

function isPublicApi(pathname: string) {
  return (
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/stripe/webhook")
  );
}

type AuthenticatedRequest = NextRequest & { auth?: Session | null };

export default auth((req: AuthenticatedRequest) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const needsAuth = pathname.startsWith("/app") || (isApiRequest(pathname) && !isPublicApi(pathname));
  if (!needsAuth) return NextResponse.next();

  const session = req.auth;
  if (!session?.user) {
    if (isApiRequest(pathname) && !isAuthApi(pathname)) {
      return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
    }
    const url = new URL("/login", nextUrl);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!session.user.emailVerified && pathname.startsWith("/app")) {
    return NextResponse.redirect(new URL("/verify", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
