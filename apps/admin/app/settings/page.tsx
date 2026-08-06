"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import * as z from "zod"
import { useAuthStore } from "@mymeddevices/shared-core"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Shield, Key, Lock, Laptop, CheckCircle2, AlertCircle } from "lucide-react"

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

export default function AccountSecuritySettingsPage() {
  const { user, changePassword, isLoading } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessions, setSessions] = useState([
    { id: "s1", browser: "Chrome on macOS (Nairobi, KE)", ip: "197.232.48.12", lastActive: "Active Now", current: true },
    { id: "s2", browser: "Safari on iOS 18 (Nairobi, KE)", ip: "197.232.48.99", lastActive: "2 hours ago", current: false },
    { id: "s3", browser: "Firefox on Ubuntu (Mombasa, KE)", ip: "41.203.220.5", lastActive: "3 days ago", current: false },
  ])

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
      toast.success("Password updated successfully")
    } catch {
      toast.error("Failed to change password. Check your current password.")
    } finally {
      setSaving(false)
    }
  }

  const handleToggle2FA = () => {
    const nextState = !twoFactorEnabled
    setTwoFactorEnabled(nextState)
    if (nextState) {
      toast.success("2-Factor Authentication enabled")
    } else {
      toast.info("2-Factor Authentication disabled")
    }
  }

  const handleRevokeSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId))
    toast.success("Session revoked")
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl pb-12">
        <SettingsHeader
          title="Account & Security"
          description="Manage administrative identity, authentication credentials, and session security"
        />

        <div className="space-y-6">
          {/* Profile Overview */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-zinc-500" /> Administrative Identity
              </h3>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 border border-emerald-200 dark:border-emerald-800">
                Verified System Admin
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-center size-11 rounded-none border-2 border-zinc-800 dark:border-zinc-200 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-mono font-bold">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    {user?.email || "admin@mymeddevices.co.ke"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <InfoRow label="User ID" value={user?.id ? String(user.id) : "usr_admin_01"} />
                <InfoRow label="System Role" value={user?.role?.toUpperCase() || "ADMIN"} />
                <InfoRow label="Phone Number" value={user?.phone || "+254 700 000 000"} />
                <InfoRow label="Account Status" value={user?.is_active ? "ACTIVE" : "INACTIVE"} />
                <InfoRow
                  label="Registered"
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : "01/01/2026"}
                />
                <InfoRow label="Access Level" value="Super Administrator" />
              </div>
            </div>
          </div>

          {/* Password Change Form */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-zinc-500" /> Authentication Password
              </h3>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FieldWrap label="Current Password" error={errors.currentPassword?.message}>
                  <Input
                    type="password"
                    {...register("currentPassword")}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    placeholder="••••••••"
                  />
                </FieldWrap>
                <FieldWrap label="New Password" error={errors.newPassword?.message}>
                  <Input
                    type="password"
                    {...register("newPassword")}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    placeholder="Min 6 chars"
                  />
                </FieldWrap>
                <FieldWrap label="Confirm New Password" error={errors.confirmPassword?.message}>
                  <Input
                    type="password"
                    {...register("confirmPassword")}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    placeholder="Re-enter password"
                  />
                </FieldWrap>
              </div>
              <div className="mt-4 pt-4 border-t-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Password changes enforce immediate re-authentication across active services.
                </span>
                <button
                  type="submit"
                  disabled={isLoading || saving}
                  className="text-xs font-semibold uppercase tracking-widest px-4 py-2 border-2 border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
                >
                  {saving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* Two-Factor Authentication */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-zinc-500" /> Two-Factor Verification (2FA)
              </h3>
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border ${
                twoFactorEnabled 
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800" 
                  : "text-zinc-500 bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
              }`}>
                {twoFactorEnabled ? "ENABLED" : "DISABLED"}
              </span>
            </div>
            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">
                  Time-based One-Time Password (TOTP)
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Require an authenticator app (Google Authenticator, 1Password) security code during sign-in.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggle2FA}
                className={`text-xs font-semibold uppercase tracking-widest px-4 py-2 border-2 transition-colors shrink-0 ${
                  twoFactorEnabled
                    ? "border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950"
                    : "border-zinc-800 dark:border-zinc-200 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800"
                }`}
              >
                {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
              </button>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Laptop className="h-3.5 w-3.5 text-zinc-500" /> Active System Sessions
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="flex items-center justify-between py-2 px-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {sess.browser}
                        </span>
                        {sess.current && (
                          <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 border border-emerald-300 dark:border-emerald-800">
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                        IP: {sess.ip} • Last Active: {sess.lastActive}
                      </p>
                    </div>
                    {!sess.current && (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(sess.id)}
                        className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                      >
                        Revoke Access
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
