"use client"

import React from "react"

/**
 * Pass-through wrapper for admin dashboard pages.
 * The persistent shell is mounted at app/dashboard/layout.tsx to avoid page remounts.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
