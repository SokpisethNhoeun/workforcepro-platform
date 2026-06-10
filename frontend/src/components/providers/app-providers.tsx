"use client"

import { ThemeProvider, useTheme } from "next-themes"
import { Toaster } from "sileo"

import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/lib/auth/auth-context"

function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  // Sileo names are inverted: theme="dark" paints a LIGHT bg, theme="light"
  // paints a DARK bg. Flip so the toast bg matches the app theme.
  const theme = resolvedTheme === "dark" ? "light" : "dark"
  return <Toaster position="top-right" theme={theme} />
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          {children}
          <ThemedToaster />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
