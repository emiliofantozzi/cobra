import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Allow API routes, static files, and Next.js internals to pass through
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // In development, use pathname to determine routing
  // In production, use hostname
  const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");
  
  // Detect if request is for app subdomain (app.hqhelios.com or app.*)
  const isAppSubdomain =
    hostname.startsWith("app.") ||
    hostname.includes(".app.") ||
    (isLocalhost && (pathname.startsWith("/auth") || pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")));

  // Detect if request is for marketing domain (www.hqhelios.com, hqhelios.com, or bare domain)
  const isMarketingDomain =
    hostname.startsWith("www.") ||
    (!hostname.includes("app.") && !hostname.includes(".app.")) ||
    (isLocalhost && !pathname.startsWith("/auth") && !pathname.startsWith("/dashboard") && !pathname.startsWith("/onboarding"));

  // If on app subdomain and trying to access root, redirect to sign-in
  if (isAppSubdomain && pathname === "/") {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // If on marketing domain and trying to access app routes, redirect to app subdomain
  if (isMarketingDomain) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding") || pathname.startsWith("/auth")) {
      // In production, redirect to app subdomain
      if (!isLocalhost) {
        const appUrl = new URL(request.url);
        appUrl.hostname = hostname.replace(/^(www\.)?/, "app.");
        return NextResponse.redirect(appUrl);
      }
      // In development, allow access but log
      console.log(`[Middleware] Marketing domain accessing app route: ${pathname}`);
    }
  }

  // Default: allow request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

