"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import * as z from "zod"
import { useAuthStore } from "@mymeddevices/shared-core"
import DashboardLayout from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type PasswordForm = z.infer<typeof passwordSchema>

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
      <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
        {label}
      </span>
      <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100 text-right">
        {value || "—"}
      </span>
    </div>
  )
}

type Tab = "account" | "security"

export default function SettingsPage() {
  const { user, changePassword, isLoading } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>("account")
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: standardSchemaResolver(passwordSchema),
  })

  const onSubmit = async (data: PasswordForm) => {
    setSaving(true)
    try {
      await changePassword({ old_password: data.currentPassword, new_password: data.newPassword })
      reset()
      toast.success("Password changed successfully")
    } catch {
      toast.error("Failed to change password. Check your current password.")
    } finally {
      setSaving(false)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "account", label: "Account" },
    { key: "security", label: "Security" },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <h1 className="text-base font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
            Settings
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Account and security configuration
          </p>
        </div>

        <div className="flex gap-0 border-b-2 border-zinc-200 dark:border-zinc-800 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={
                "px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors relative " +
                (activeTab === tab.key
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400")
              }
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100" />
              )}
            </button>
          ))}
        </div>

        {activeTab === "account" && (
          <div className="max-w-2xl">
            <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                  Profile
                </h3>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-center size-10 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-mono font-bold">
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {user?.name || "Admin User"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      {user?.role || "—"}
                    </p>
                  </div>
                </div>
                <InfoRow label="Email" value={user?.email} />
                <InfoRow label="Phone" value={user?.phone} />
                <InfoRow label="Role" value={user?.role} />
                <InfoRow label="Status" value={user?.is_active ? "Active" : "Inactive"} />
                <InfoRow
                  label="Created"
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="max-w-2xl">
            <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                  Password
                </h3>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-4">
                <div className="space-y-3">
                  <FieldWrap label="Current Password" error={errors.currentPassword?.message}>
                    <Input
                      type="password"
                      {...register("currentPassword")}
                      className="rounded-none border-2 focus-visible:border-amber-500 focus-visible:ring-0"
                      placeholder="Enter current password"
                    />
                  </FieldWrap>
                  <FieldWrap label="New Password" error={errors.newPassword?.message}>
                    <Input
                      type="password"
                      {...register("newPassword")}
                      className="rounded-none border-2 focus-visible:border-amber-500 focus-visible:ring-0"
                      placeholder="At least 6 characters"
                    />
                  </FieldWrap>
                  <FieldWrap label="Confirm New Password" error={errors.confirmPassword?.message}>
                    <Input
                      type="password"
                      {...register("confirmPassword")}
                      className="rounded-none border-2 focus-visible:border-amber-500 focus-visible:ring-0"
                      placeholder="Re-enter new password"
                    />
                  </FieldWrap>
                </div>
                <div className="mt-4 pt-4 border-t-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    Use a strong, unique password
                  </span>
                  <button
                    type="submit"
                    disabled={isLoading || saving}
                    className="text-xs font-semibold uppercase tracking-widest px-4 py-2 border-2 border-zinc-800 dark:border-zinc-200 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 transition-colors"
                  >
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function FieldWrap({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium mb-1">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-rose-500 mt-0.5 font-medium">{error}</p>
      )}
    </div>
  )
}
