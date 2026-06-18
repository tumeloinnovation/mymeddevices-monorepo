"use client"

import * as React from "react"
import { Providers as SharedProviders } from "@mymeddevices/shared-admin"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SharedProviders>
      <TooltipProvider delayDuration={0}>
        {children}
      </TooltipProvider>
    </SharedProviders>
  )
}
