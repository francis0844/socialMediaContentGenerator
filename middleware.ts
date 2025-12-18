import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function isApiRequest(pathname: string) {
  return pathname.startsWith("/api/");
}

function isPublicApi(pathname: string) {
  return (
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/api/auth/register") ||
    pathname.startsWith("/api/auth/verify")
  );
}

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const needsAuth = pathname.startsWith("/app") || (isApiRequest(pathname) && !isPublicApi(pathname));
  if (!needsAuth) return NextResponse.next();

  const token = await getToken({ req });

  if (!token) {
    if (isApiRequest(pathname)) {
      return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
    }
    const url = new URL("/login", nextUrl);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/app") && token.emailVerified === false) {
    return NextResponse.redirect(new URL("/verify", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
