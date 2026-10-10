import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("cp_session")?.value;
  if (!session) {
    const login = new URL("/login", request.url);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/today",
    "/today/:path*",
    "/calendar",
    "/calendar/:path*",
    "/clients",
    "/clients/:path*",
    "/settings",
    "/settings/:path*",
    "/appointments/:path*",
    "/onboarding",
  ],
};
