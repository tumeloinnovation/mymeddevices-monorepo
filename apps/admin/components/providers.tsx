"use client"

import * as React from "react"
import { Providers as SharedProviders } from "@mymeddevices/shared-admin"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuthStore, useAuthCookie } from "@mymeddevices/shared-core"

export function Providers({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrated, login } = useAuthStore()
  const { setAuthCookie } = useAuthCookie()

  React.useEffect(() => {
    if (process.env.NODE_ENV === "development" && hydrated && !isAuthenticated) {
      // Avoid auto-login loop if user explicitly logged out in this session
      if (sessionStorage.getItem("dev_logged_out") === "true") {
        return
      }

      console.log("🛠️ [Dev Auto-Login] Auto-authenticating as admin...")
      login({ email: "admin@mymeddevices.com", password: "Admin123!" }, "admin")
        .then(() => {
          setAuthCookie("1")
          console.log("🛠️ [Dev Auto-Login] Authenticated successfully.")
        })
        .catch((err) => {
          console.error("🛠️ [Dev Auto-Login] Auto-login failed:", err)
        })
    }
  }, [hydrated, isAuthenticated, login, setAuthCookie])

  return (
    <SharedProviders>
      <TooltipProvider delayDuration={0}>
        {children}
      </TooltipProvider>
    </SharedProviders>
  )
}

