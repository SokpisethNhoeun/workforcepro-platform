import type { NextRequest } from "next/server"

import { forwardBackendApiRequest } from "@/services/backend-api.service"

type Context = {
  params: Promise<{ path: string[] }>
}

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, context: Context) {
  return forwardBackendApiRequest(request, context)
}

export async function POST(request: NextRequest, context: Context) {
  return forwardBackendApiRequest(request, context)
}

export async function PUT(request: NextRequest, context: Context) {
  return forwardBackendApiRequest(request, context)
}

export async function PATCH(request: NextRequest, context: Context) {
  return forwardBackendApiRequest(request, context)
}

export async function DELETE(request: NextRequest, context: Context) {
  return forwardBackendApiRequest(request, context)
}

export async function HEAD(request: NextRequest, context: Context) {
  return forwardBackendApiRequest(request, context)
}
