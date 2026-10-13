import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabaseMiddleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Refresh Supabase session cookies on every request
  const { supabaseResponse, user } = await updateSession(request);

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isChatRoute = pathname === "/" || pathname.startsWith("/chat");

  // Unauthenticated user trying to access protected chat routes -> Redirect to /login
  if (!user && isChatRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access auth pages (/login, /signup) -> Redirect to /chat
  if (user && isAuthRoute) {
    const chatUrl = request.nextUrl.clone();
    chatUrl.pathname = "/chat";
    chatUrl.searchParams.delete("redirect");
    return NextResponse.redirect(chatUrl);
  }

  // Authenticated user accessing root "/" -> Redirect to /chat
  if (user && pathname === "/") {
    const chatUrl = request.nextUrl.clone();
    chatUrl.pathname = "/chat";
    return NextResponse.redirect(chatUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static file extensions (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
