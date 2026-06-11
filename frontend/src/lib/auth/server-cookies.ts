import { cookies } from "next/headers"

export const TOKEN_COOKIE_NAME = "wfp_token"

const IS_PRODUCTION = process.env.NODE_ENV === "production"

export async function setTokenCookie(token: string, remember = false) {
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24
  const cookieStore = await cookies()

  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    path: "/",
    maxAge,
  })
}

export async function getTokenCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(TOKEN_COOKIE_NAME)?.value
}

export async function clearTokenCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_COOKIE_NAME)
}
