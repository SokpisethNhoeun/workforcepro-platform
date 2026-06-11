export const dynamic = "force-dynamic"

export async function GET() {
  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return Response.json({ success: false, message: "API_BASE_URL is not configured." }, { status: 500 })
  }

  try {
    const response = await fetch(`${baseUrl}/api/v1/auth/google`, {
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      cache: "no-store",
    })

    const data = await response.json()

    return Response.json(data, { status: response.status })
  } catch {
    return Response.json({ success: false, message: "Unable to reach the backend API." }, { status: 502 })
  }
}
