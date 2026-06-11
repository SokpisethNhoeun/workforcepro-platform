import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const TOKEN_COOKIE_NAME = "wfp_token"

const IS_PRODUCTION = process.env.NODE_ENV === "production"

function tokenCookieOptions(remember = false) {
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24

  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  }
}

export async function setTokenCookie(token: string, remember = false) {
  const cookieStore = await cookies()

  cookieStore.set(TOKEN_COOKIE_NAME, token, tokenCookieOptions(remember))
}

export function setTokenCookieOnResponse<T>(response: NextResponse<T>, token: string, remember = false) {
  response.cookies.set(TOKEN_COOKIE_NAME, token, tokenCookieOptions(remember))
  return response
}

export async function getTokenCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(TOKEN_COOKIE_NAME)?.value
}

export async function clearTokenCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_COOKIE_NAME)
}

export function clearTokenCookieOnResponse<T>(response: NextResponse<T>) {
  response.cookies.delete(TOKEN_COOKIE_NAME)
  return response
}
