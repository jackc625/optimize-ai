import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthed = request.cookies.get("sb-authed")?.value === "true";

  if (!isAuthed) {
    const loginUrl = new URL("/auth/login", request.url);
    const destination = request.nextUrl.pathname + request.nextUrl.search;
    // Validate redirect is a safe relative path (prevents open redirect)
    if (destination.startsWith("/") && !destination.startsWith("//")) {
      loginUrl.searchParams.set("redirect", destination);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
