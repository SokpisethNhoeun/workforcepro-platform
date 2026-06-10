"use client"

import * as React from "react"

import { api } from "./client"
import type { FormComboboxOption } from "@/components/form"

type LookupRecord = {
  id: number | string
  [key: string]: unknown
}

type LookupConfig = {
  endpoint: string
  labelKey?: string
  descriptionKey?: string
  fallbackLabelKeys?: string[]
}

const LOOKUPS = {
  employees: {
    endpoint: "/api/v1/employees?per_page=200",
    labelKey: "full_name",
    fallbackLabelKeys: ["first_name", "last_name", "employee_code"],
    descriptionKey: "employee_code",
  },
  departments: {
    endpoint: "/api/v1/departments?per_page=200",
    labelKey: "name",
    descriptionKey: "code",
  },
  positions: {
    endpoint: "/api/v1/positions?per_page=200",
    labelKey: "title",
    descriptionKey: "code",
  },
  leaveTypes: {
    endpoint: "/api/v1/leave-types?per_page=100",
    labelKey: "name",
    descriptionKey: "code",
  },
  shifts: {
    endpoint: "/api/v1/shifts?per_page=100",
    labelKey: "name",
    descriptionKey: "code",
  },
  jobPostings: {
    endpoint: "/api/v1/job-postings?per_page=100",
    labelKey: "title",
    descriptionKey: "code",
  },
} satisfies Record<string, LookupConfig>

export type LookupKey = keyof typeof LOOKUPS

function buildLabel(record: LookupRecord, cfg: LookupConfig): string {
  const primary = cfg.labelKey ? record[cfg.labelKey] : undefined
  if (typeof primary === "string" && primary.trim()) return primary
  for (const key of cfg.fallbackLabelKeys ?? []) {
    const v = record[key]
    if (typeof v === "string" && v.trim()) return v
  }
  if (cfg.fallbackLabelKeys?.length) {
    const joined = cfg.fallbackLabelKeys
      .map((k) => record[k])
      .filter((v): v is string => typeof v === "string" && v.length > 0)
      .join(" ")
    if (joined.trim()) return joined
  }
  return `#${record.id}`
}

export function useLookup(key: LookupKey, params?: Record<string, string | number | undefined | null>) {
  const [options, setOptions] = React.useState<FormComboboxOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const paramKey = React.useMemo(() => {
    if (!params) return ""
    const entries = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .sort(([a], [b]) => a.localeCompare(b))
    return entries.map(([k, v]) => `${k}=${v}`).join("&")
  }, [params])

  React.useEffect(() => {
    let cancelled = false
    const cfg = LOOKUPS[key]

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const url = paramKey
          ? `${cfg.endpoint}${cfg.endpoint.includes("?") ? "&" : "?"}${paramKey}`
          : cfg.endpoint
        const res = await api.get(url)
        const raw = res.data?.data
        const records = Array.isArray(raw) ? raw : []
        const mapped: FormComboboxOption[] = records.map((record: LookupRecord) => ({
          value: String(record.id),
          label: buildLabel(record, cfg),
          description:
            cfg.descriptionKey && typeof record[cfg.descriptionKey] === "string"
              ? (record[cfg.descriptionKey] as string)
              : undefined,
        }))
        if (!cancelled) setOptions(mapped)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load options")
          setOptions([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [key, paramKey])

  return { options, loading, error }
}
