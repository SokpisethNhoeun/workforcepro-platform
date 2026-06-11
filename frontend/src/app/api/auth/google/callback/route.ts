import { NextRequest, NextResponse } from "next/server"

import { setTokenCookieOnResponse } from "@/lib/auth/server-cookies"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return Response.json({ success: false, message: "API_BASE_URL is not configured." }, { status: 500 })
  }

  const body = await request.json()

  const response = await fetch(`${baseUrl}/api/v1/auth/google/callback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({ code: body.code }),
  })

  const data = await response.json()

  if (!response.ok) {
    return Response.json(data, { status: response.status })
  }

  const token = data.data?.access_token

  if (data.data?.two_factor_required) {
    return NextResponse.json(data)
  }

  const responseData = { ...data.data }
  delete responseData.access_token
  delete responseData.token_type

  const nextResponse = NextResponse.json({
    ...data,
    data: responseData,
  })

  if (token) {
    setTokenCookieOnResponse(nextResponse, token, true)
  }

  return nextResponse
}
