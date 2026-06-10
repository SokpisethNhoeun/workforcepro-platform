import { NextResponse, type NextRequest } from "next/server"

import { AUTH_COOKIE_NAME } from "@/lib/auth/cookie"

const PUBLIC_PATHS = new Set<string>([
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
])

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isAuthed = !!request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.has(pathname)) {
    if (isAuthed && pathname === "/login") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      url.search = ""
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (!isAuthed) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
}
