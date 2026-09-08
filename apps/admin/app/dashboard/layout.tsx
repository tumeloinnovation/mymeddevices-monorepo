"use client";

import React from "react";
import { DashboardLayout as SharedDashboardLayout } from "@mymeddevices/shared-admin";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SharedDashboardLayout theme="admin">{children}</SharedDashboardLayout>;
}
