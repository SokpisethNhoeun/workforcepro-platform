"use client"

import * as React from "react"
import { SaveIcon, Settings2Icon } from "lucide-react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, csrf } from "@/lib/api/client"

type Setting = {
  id: number
  key: string
  value: string | null
  group: string
  type: string
}

const initialSettings: Setting[] = []

function mapSettingValues(settings: Setting[]) {
  return Object.fromEntries(settings.map((setting) => [setting.key, setting.value ?? ""]))
}

export function SettingsPage() {
  const [settings, setSettings] = React.useState<Setting[]>(initialSettings)
  const [editValues, setEditValues] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await api.get("/api/v1/settings")
        if (mounted && Array.isArray(res.data?.data)) {
          const loaded = res.data.data as Setting[]
          setSettings(loaded)
          setEditValues(mapSettingValues(loaded))
        }
      } catch {
        if (mounted) {
          setSettings(initialSettings)
          setEditValues(mapSettingValues(initialSettings))
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  function handleChange(key: string, value: string) {
    setEditValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await csrf()
      const payload = Object.entries(editValues).map(([key, value]) => ({ key, value }))
      const res = await api.put("/api/v1/settings", { settings: payload })
      if (Array.isArray(res.data?.data)) {
        const updated = res.data.data as Setting[]
        setSettings(updated)
        setEditValues(mapSettingValues(updated))
      }
      sileo.success({ title: "Settings saved" })
    } catch {
      sileo.error({ title: "Save failed" })
    } finally {
      setSaving(false)
    }
  }

  const groups = [...new Set(settings.map((s) => s.group))]

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Settings2Icon className="size-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Settings</h1>
              <p className="text-sm text-muted-foreground">System configuration</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <SaveIcon className="size-4" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </section>

      {groups.map((group) => (
        <section key={group} className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold capitalize">{group} Settings</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {settings
              .filter((s) => s.group === group)
              .map((s) => (
                <label key={s.key} className="grid gap-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">{s.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                  <Input
                    type={s.type === "number" ? "number" : "text"}
                    step={s.type === "number" ? "any" : undefined}
                    value={editValues[s.key] ?? ""}
                    onChange={(e) => handleChange(s.key, e.target.value)}
                  />
                </label>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
