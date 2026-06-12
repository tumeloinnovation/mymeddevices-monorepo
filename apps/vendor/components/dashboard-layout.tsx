"use client"

import { DashboardLayout as SharedDashboardLayout } from "@mymeddevices/shared-admin"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SharedDashboardLayout theme="vendor">{children}</SharedDashboardLayout>
}
