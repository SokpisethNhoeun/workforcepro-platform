import type { NextRequest } from "next/server"

type BackendProxyContext = {
  params: Promise<{ path: string[] }>
}

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
])

const FORWARDED_REQUEST_HEADERS = new Set([
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "ngrok-skip-browser-warning",
  "x-requested-with",
])

function apiError(message: string, request: NextRequest, status = 500) {
  return Response.json(
    {
      success: false,
      message,
      errors: {},
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

function backendBaseUrl() {
  const url = process.env.API_BASE_URL
  if (!url) return null
  return url.endsWith("/") ? url.slice(0, -1) : url
}

function createBackendUrl(baseUrl: string, path: string[], request: NextRequest) {
  const apiPath = path.map((segment) => encodeURIComponent(segment)).join("/")
  const url = new URL(`/api/v1/${apiPath}`, baseUrl)
  url.search = request.nextUrl.search
  return url
}

function forwardedRequestHeaders(request: NextRequest) {
  const headers = new Headers()

  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase()
    if (FORWARDED_REQUEST_HEADERS.has(lowerKey)) {
      headers.set(key, value)
    }
  })

  headers.set("ngrok-skip-browser-warning", "true")

  return headers
}

function forwardedResponseHeaders(response: Response) {
  const headers = new Headers()

  response.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })

  return headers
}

async function requestBody(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD") return undefined
  const body = await request.arrayBuffer()
  return body.byteLength ? body : undefined
}

export async function forwardBackendApiRequest(request: NextRequest, context: BackendProxyContext) {
  const baseUrl = backendBaseUrl()
  if (!baseUrl) {
    return apiError("API_BASE_URL is not configured.", request)
  }

  const { path } = await context.params
  const targetUrl = createBackendUrl(baseUrl, path, request)

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: forwardedRequestHeaders(request),
      body: await requestBody(request),
      cache: "no-store",
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: forwardedResponseHeaders(response),
    })
  } catch {
    return apiError("Unable to reach the backend API.", request, 502)
  }
}
