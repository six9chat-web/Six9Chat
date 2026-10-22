import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve incoming Cookie header
  const rawCookieHeader = request.headers.get("cookie") || "";

  // Check all incoming cookies
  const allCookies = request.cookies.getAll();
  const legacyCookieNames = allCookies
    .filter(
      (c) =>
        c.name.startsWith("sb-") ||
        c.name.includes("-auth-token") ||
        c.name.startsWith("supabase-") ||
        c.name.startsWith("six9_mock_session")
    )
    .map((c) => c.name);

  const hasBloatedCookies = legacyCookieNames.length > 0 || rawCookieHeader.length > 2048;

  let response: NextResponse;

  if (hasBloatedCookies) {
    // Strip bloated session cookies from downstream request headers to eliminate 494 overflows
    const filteredCookies = rawCookieHeader
      .split(";")
      .map((c) => c.trim())
      .filter((c) => {
        const name = c.split("=")[0].trim();
        return (
          !name.startsWith("sb-") &&
          !name.includes("-auth-token") &&
          !name.startsWith("supabase-") &&
          !name.startsWith("six9_mock_session")
        );
      })
      .join("; ");

    const requestHeaders = new Headers(request.headers);
    if (filteredCookies) {
      requestHeaders.set("cookie", filteredCookies);
    } else {
      requestHeaders.delete("cookie");
    }

    if (pathname === "/") {
      const chatUrl = request.nextUrl.clone();
      chatUrl.pathname = "/chat";
      response = NextResponse.redirect(chatUrl);
    } else {
      response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Attach Set-Cookie deletion directives for all legacy cookies found
    legacyCookieNames.forEach((name) => {
      response.cookies.delete(name);
    });
    response.cookies.delete("six9_mock_session");
  } else {
    if (pathname === "/") {
      const chatUrl = request.nextUrl.clone();
      chatUrl.pathname = "/chat";
      return NextResponse.redirect(chatUrl);
    }
    response = NextResponse.next();
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static file extensions (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
