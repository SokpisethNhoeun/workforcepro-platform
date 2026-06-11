import { NextRequest } from "next/server"

import { setTokenCookie } from "@/lib/auth/server-cookies"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return Response.json({ success: false, message: "API_BASE_URL is not configured." }, { status: 500 })
  }

  const body = await request.json()

  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    return Response.json(data, { status: response.status })
  }

  if (data.data?.two_factor_required) {
    return Response.json(data)
  }

  const token = data.data?.access_token
  if (token) {
    await setTokenCookie(token, body.remember ?? false)
  }

  const responseData = { ...data.data }
  delete responseData.access_token
  delete responseData.token_type

  return Response.json({
    ...data,
    data: responseData,
  })
}
