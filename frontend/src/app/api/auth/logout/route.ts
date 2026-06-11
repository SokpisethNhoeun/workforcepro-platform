import { NextResponse } from "next/server"

import { clearTokenCookieOnResponse, getTokenCookie } from "@/lib/auth/server-cookies"

export const dynamic = "force-dynamic"

export async function POST() {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return Response.json({ success: false, message: "API_BASE_URL is not configured." }, { status: 500 })
  }

  const token = await getTokenCookie()

  if (token) {
    try {
      await fetch(`${baseUrl}/api/v1/auth/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      })
    } catch {
      // Backend may be down — still clear the cookie
    }
  }

  const response = NextResponse.json({ success: true, message: "Logged out." })
  clearTokenCookieOnResponse(response)

  return response
}
