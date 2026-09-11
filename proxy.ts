import { NextResponse, type NextRequest } from "next/server";
import { sessionName, validSession } from "./lib/auth";
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if ((pathname === "/demo" || pathname.startsWith("/demo/")) && !["GET", "HEAD"].includes(request.method)) {
    return NextResponse.json({ error: "This demonstration is read-only." }, { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const publicApi =
    pathname === "/api/leads" ||
    pathname === "/api/auth/login" ||
    pathname === "/api/health" ||
    /^\/api\/quotes\/[^/]+\/respond$/.test(pathname);
  const protectedRoute =
    pathname.startsWith("/dashboard") ||
    (pathname.startsWith("/api/") && !publicApi);
  if (
    protectedRoute &&
    !validSession(request.cookies.get(sessionName)?.value)
  ) {
    if (pathname.startsWith("/api/"))
      return NextResponse.json(
        { error: "Please sign in to the owner workspace." },
        { status: 401 },
      );
    const url = new URL("/login", process.env.APP_ORIGIN || request.url);
    return NextResponse.redirect(url);
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: ["/demo/:path*", "/dashboard/:path*", "/api/:path*", "/quotes/:path*", "/login"],
};
