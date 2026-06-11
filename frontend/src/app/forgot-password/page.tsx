"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRoundIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@heroui/react"

import { AuthCard } from "@/components/auth/auth-card"
import { Input } from "@/components/ui/input"
import { api, apiErrorMessage } from "@/lib/api/client"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
})

type ForgotForm = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const router = useRouter()

  const form = useForm<ForgotForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: ForgotForm) {
    try {
      await api.post("/api/v1/auth/forgot-password", { email: values.email })
      sileo.success({
        title: "Reset link sent",
        description: "Check your inbox for a password reset link.",
      })
      router.push(`/reset-password?email=${encodeURIComponent(values.email)}&method=link`)
    } catch (error) {
      sileo.error({
        title: "Request failed",
        description: apiErrorMessage(error, "Something went wrong. Please try again."),
      })
    }
  }

  return (
    <AuthCard
      title="Forgot password?"
      description="Enter your email and we'll send you a reset link"
      icon={<KeyRoundIcon className="size-4" />}
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            autoFocus
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          isDisabled={form.formState.isSubmitting}
          fullWidth
          className="mt-2"
        >
          {form.formState.isSubmitting ? "Sending link..." : "Send reset link"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  )
}
