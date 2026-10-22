import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve incoming Cookie header
  const rawCookieHeader = request.headers.get("cookie") || "";

  // Proactively check for bloated or legacy session cookies
  const hasBloatedCookies =
    rawCookieHeader.includes("six9_mock_session") ||
    rawCookieHeader.includes("sb-") ||
    rawCookieHeader.includes("-auth-token") ||
    rawCookieHeader.length > 2048;

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

    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Send Set-Cookie deletion directives to instruct browser to erase legacy cookies
    response.cookies.delete("six9_mock_session");
  } else {
    response = NextResponse.next();
  }

  // Redirect root "/" to "/chat"
  if (pathname === "/") {
    const chatUrl = request.nextUrl.clone();
    chatUrl.pathname = "/chat";
    return NextResponse.redirect(chatUrl);
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
