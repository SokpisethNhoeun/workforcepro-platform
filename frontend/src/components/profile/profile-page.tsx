"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRoundIcon, SaveIcon, UserCheckIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { TwoFactorSetup } from "@/components/profile/two-factor-setup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, csrf } from "@/lib/api/client"

const profileSchema = z.object({
  name: z.string().min(1, "Required"),
  phone: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, "Required"),
  password: z.string().min(8, "Minimum 8 characters"),
  password_confirmation: z.string().min(1, "Required"),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

type UserProfile = {
  id: number
  name: string
  email: string
  phone: string | null
  locale: string | null
  timezone: string | null
  email_verified_at: string | null
  roles: { name: string }[]
  employee?: {
    employee_code: string
    department?: { name: string } | null
    position?: { title: string } | null
  } | null
}

const initialProfile: UserProfile = {
  id: 0,
  name: "",
  email: "",
  phone: null,
  locale: "en",
  timezone: "Asia/Phnom_Penh",
  email_verified_at: null,
  roles: [],
  employee: null,
}

export function ProfilePage() {
  const [profile, setProfile] = React.useState<UserProfile>(initialProfile)
  const [isLoading, setIsLoading] = React.useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: initialProfile.name, phone: initialProfile.phone ?? "", locale: initialProfile.locale ?? "en", timezone: initialProfile.timezone ?? "Asia/Phnom_Penh" },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
  })

  React.useEffect(() => {
    let mounted = true
    async function load() {
      setIsLoading(true)
      try {
        const res = await api.get("/api/v1/auth/me")
        if (mounted && res.data?.data) {
          const user = res.data.data as UserProfile
          setProfile(user)
          profileForm.reset({
            name: user.name,
            phone: user.phone ?? "",
            locale: user.locale ?? "en",
            timezone: user.timezone ?? "Asia/Phnom_Penh",
          })
        }
      } catch {
        if (mounted) setProfile(initialProfile)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [profileForm])

  async function onProfileSubmit(values: ProfileForm) {
    try {
      await csrf()
      const res = await api.put("/api/v1/profile", values)
      if (res.data?.data) setProfile(res.data.data as UserProfile)
      sileo.success({ title: "Profile updated" })
    } catch {
      sileo.error({ title: "Update failed" })
    }
  }

  async function onPasswordSubmit(values: PasswordForm) {
    try {
      await csrf()
      await api.post("/api/v1/auth/change-password", values)
      passwordForm.reset()
      sileo.success({ title: "Password changed" })
    } catch {
      sileo.error({ title: "Password change failed", description: "Check your current password." })
    }
  }

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <UserCheckIcon className="size-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your account settings</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{profile.name}</h2>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <div className="mt-1 flex gap-2">
                  {profile.roles.map((role) => (
                    <span key={role.name} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{role.name}</span>
                  ))}
                </div>
              </div>
            </div>

            {profile.employee && (
              <div className="mt-4 grid grid-cols-3 gap-4 rounded-md border p-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Employee Code</p>
                  <p className="font-medium">{profile.employee.employee_code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="font-medium">{profile.employee.department?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Position</p>
                  <p className="font-medium">{profile.employee.position?.title ?? "—"}</p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold">Account Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Full Name</span>
                <Input {...profileForm.register("name")} />
                {profileForm.formState.errors.name && <span className="text-xs text-destructive">{profileForm.formState.errors.name.message}</span>}
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Phone</span>
                <Input {...profileForm.register("phone")} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Locale</span>
                <select
                  {...profileForm.register("locale")}
                  className="h-9 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="en">English</option>
                  <option value="km">Khmer</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Timezone</span>
                <select
                  {...profileForm.register("timezone")}
                  className="h-9 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Asia/Phnom_Penh">Asia/Phnom_Penh</option>
                  <option value="Asia/Bangkok">Asia/Bangkok</option>
                  <option value="UTC">UTC</option>
                </select>
              </label>
            </div>
            <Button type="submit" className="mt-4" disabled={isLoading}>
              <SaveIcon className="size-4" />
              Save Changes
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <KeyRoundIcon className="size-4" />
              <h3 className="text-sm font-semibold">Change Password</h3>
            </div>
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Current Password</span>
                <Input type="password" {...passwordForm.register("current_password")} />
                {passwordForm.formState.errors.current_password && <span className="text-xs text-destructive">{passwordForm.formState.errors.current_password.message}</span>}
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-xs font-medium text-muted-foreground">New Password</span>
                <Input type="password" {...passwordForm.register("password")} />
                {passwordForm.formState.errors.password && <span className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</span>}
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Confirm Password</span>
                <Input type="password" {...passwordForm.register("password_confirmation")} />
                {passwordForm.formState.errors.password_confirmation && <span className="text-xs text-destructive">{passwordForm.formState.errors.password_confirmation.message}</span>}
              </label>
              <Button type="submit" className="mt-2">
                <KeyRoundIcon className="size-4" />
                Update Password
              </Button>
            </div>
          </form>

          <TwoFactorSetup />
        </div>
      </section>
    </div>
  )
}
