export const AUTH_COOKIE_NAME = "wfp_auth"

export function setAuthCookie(token: string, remember = true) {
  if (typeof document === "undefined") return
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8
  document.cookie = `${AUTH_COOKIE_NAME}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  void token
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function getAuthCookie() {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp('(^| )' + AUTH_COOKIE_NAME + '=([^;]+)'))
  return match ? match[2] : null
}
