import axios, { AxiosError, type AxiosResponse } from "axios"

import { clearAuthCookie } from "@/lib/auth/cookie"

type ApiErrorPayload = {
  message?: string
  errors?: Record<string, string[]>
}

export type ApiEnvelope<T> = {
  success: boolean
  message?: string
  data: T
  meta?: Record<string, unknown>
}

export const api = axios.create({
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (error.response?.status === 401) {
      clearAuthCookie()
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login")
      }
    }

    return Promise.reject(error)
  }
)

export async function csrf() {
  // No-op: auth token is managed server-side via HttpOnly cookie.
}

export function apiData<T>(response: AxiosResponse<ApiEnvelope<T>>) {
  return response.data.data
}

export function apiMeta(response: AxiosResponse<ApiEnvelope<unknown>>) {
  return response.data.meta ?? {}
}

/**
 * Strip values that Laravel validators reject as empty strings (e.g. `exists`,
 * `date`, `email` rules treat `""` as invalid rather than missing). Pass any
 * form payload through this before POST/PUT.
 */
export function sanitizePayload<T extends Record<string, unknown>>(payload: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (value === "" || value === undefined) continue
    if (value === null) continue
    out[key] = value
  }
  return out as Partial<T>
}

export function apiErrorMessage(error: unknown, fallback = "Request failed") {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const firstErrors = Object.values(error.response?.data?.errors ?? {}).flat()
    return firstErrors[0] ?? error.response?.data?.message ?? fallback
  }

  return fallback
}
