"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuthStore } from "@mymeddevices/shared-core"
import DashboardLayout from "@/components/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface SystemStatus {
  smtp: { host: string; port: number; enabled: boolean }
  sms: { sender_id: string; enabled: boolean }
}

interface RateLimit {
  max_requests: number
  window_seconds: number
}

function RateLimitsSection({ 
  limits, 
  onUpdate 
}: { 
  limits: Record<string, [number, number]>
  onUpdate: (newLimits: Record<string, [number, number]>) => Promise<void>
}) {
  const [editingLimits, setEditingLimits] = useState<Record<string, [number, number]>>(limits)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setEditingLimits(limits)
  }, [limits])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate(editingLimits)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (key: string, index: number, value: string) => {
    const numValue = parseInt(value) || 0
    setEditingLimits(prev => {
      const current = [...prev[key]] as [number, number]
      current[index] = numValue
      return { ...prev, [key]: current }
    })
  }

  return (
    <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 mt-4">
      <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
          Rate Limits
        </h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Edit Limits
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditingLimits(limits)
                setIsEditing(false)
              }}
              disabled={isSaving}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-rose-500 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="grid gap-2">
          <div className="grid grid-cols-3 text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1 px-1">
            <span>Endpoint</span>
            <span>Max Requests</span>
            <span>Window (sec)</span>
          </div>
          {Object.entries(editingLimits).map(([key, [max, window]]) => (
            <div key={key} className="grid grid-cols-3 items-center py-2 px-1 border-b border-zinc-100 dark:border-zinc-900 last:border-0">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-tight">
                {key.replace(/_/g, ' ')}
              </span>
              <div className="pr-4">
                {isEditing ? (
                  <input
                    type="number"
                    value={max}
                    onChange={(e) => handleChange(key, 0, e.target.value)}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border-0 text-xs font-mono py-1 px-2 focus:ring-1 focus:ring-zinc-400 outline-none"
                  />
                ) : (
                  <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {max}
                  </span>
                )}
              </div>
              <div>
                {isEditing ? (
                  <input
                    type="number"
                    value={window}
                    onChange={(e) => handleChange(key, 1, e.target.value)}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border-0 text-xs font-mono py-1 px-2 focus:ring-1 focus:ring-zinc-400 outline-none"
                  />
                ) : (
                  <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {window}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface SystemStatus {
  smtp: { host: string; port: number; enabled: boolean }
  sms: { sender_id: string; enabled: boolean }
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={
        "inline-block size-1.5 shrink-0 " +
        (active ? "bg-emerald-500" : "bg-rose-500")
      }
    />
  )
}

function DataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
      <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
        {label}
      </span>
      <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100 text-right tabular-nums">
        {children}
      </span>
    </div>
  )
}

function StatusCardShell({
  title,
  status,
  statusLabel,
  children,
}: {
  title: string
  status: boolean
  statusLabel: string
  children: React.ReactNode
}) {
  return (
    <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
          {title}
        </h3>
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <StatusDot active={status} />
          <span className={status ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
            {statusLabel}
          </span>
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function StatusHeaderBar({ allOk }: { allOk: boolean }) {
  return (
    <div
      className={
        "border-2 px-4 py-3 flex items-center gap-3 " +
        (allOk
          ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40"
          : "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40")
      }
    >
      <span
        className={
          "flex items-center justify-center size-5 " +
          (allOk
            ? "bg-emerald-500 text-white"
            : "bg-rose-500 text-white")
        }
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="size-3">
          {allOk ? (
            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
          ) : (
            <path d="M4.22 4.22a.75.75 0 011.06 0L8 6.94l2.72-2.72a.75.75 0 111.06 1.06L9.06 8l2.72 2.72a.75.75 0 11-1.06 1.06L8 9.06l-2.72 2.72a.75.75 0 01-1.06-1.06L6.94 8 4.22 5.28a.75.75 0 010-1.06z" />
          )}
        </svg>
      </span>
      <div>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {allOk ? "All Systems Operational" : "System Degraded"}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {allOk
            ? "All monitored services are running normally"
            : "One or more services are experiencing issues"}
        </p>
      </div>
    </div>
  )
}

export default function SystemSettingsPage() {
  const { getSystemStatus, getRateLimits, updateRateLimits } = useAuthStore()
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [rateLimits, setRateLimits] = useState<Record<string, [number, number]> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setStatus(null)
    setRateLimits(null)
    try {
      const [statusResult, limitsResult] = await Promise.all([
        getSystemStatus(),
        getRateLimits()
      ])
      setStatus(statusResult as unknown as SystemStatus)
      setRateLimits(limitsResult)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to fetch system data"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [getSystemStatus, getRateLimits])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const allOk = status ? status.smtp.enabled && status.sms.enabled : false

  return (
    <DashboardLayout>
      <div className="max-w-3xl pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
              System Settings
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Infrastructure health and application configuration
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="text-xs font-medium uppercase tracking-wider px-3 py-1.5 border-2 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-none" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-40 w-full rounded-none" />
              <Skeleton className="h-40 w-full rounded-none" />
            </div>
            <Skeleton className="h-64 w-full rounded-none" />
          </div>
        ) : error ? (
          <div className="border-2 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40">
            <div className="px-4 py-2.5 border-b-2 border-rose-200 dark:border-rose-900 bg-rose-100/50 dark:bg-rose-900/30">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-700 dark:text-rose-300">
                Connection Error
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm font-mono text-rose-600 dark:text-rose-400">
                {error}
              </p>
              <p className="text-xs text-rose-500/70 dark:text-rose-400/70">
                Ensure the backend server is running and you are authenticated as an admin.
              </p>
              <button
                onClick={fetchData}
                className="text-xs font-medium uppercase tracking-wider px-3 py-1.5 border-2 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {status && (
              <>
                <StatusHeaderBar allOk={allOk} />

                <div className="grid gap-4 md:grid-cols-2">
                  <StatusCardShell
                    title="SMTP"
                    status={status.smtp.enabled}
                    statusLabel={status.smtp.enabled ? "Connected" : "Disconnected"}
                  >
                    <DataRow label="Host">{status.smtp.host || "—"}</DataRow>
                    <DataRow label="Port">{status.smtp.port}</DataRow>
                    <DataRow label="Authentication">
                      <span className={status.smtp.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        {status.smtp.enabled ? "Configured" : "Missing"}
                      </span>
                    </DataRow>
                  </StatusCardShell>

                  <StatusCardShell
                    title="SMS"
                    status={status.sms.enabled}
                    statusLabel={status.sms.enabled ? "Connected" : "Disconnected"}
                  >
                    <DataRow label="Sender ID">{status.sms.sender_id || "—"}</DataRow>
                    <DataRow label="Provider">Hostpinnacle</DataRow>
                    <DataRow label="API Key">
                      <span className={status.sms.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        {status.sms.enabled ? "Configured" : "Missing"}
                      </span>
                    </DataRow>
                  </StatusCardShell>
                </div>
              </>
            )}

            {rateLimits && (
              <RateLimitsSection 
                limits={rateLimits} 
                onUpdate={async (newLimits) => {
                  await updateRateLimits(newLimits)
                  setRateLimits(newLimits)
                }} 
              />
            )}

            <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="flex items-center px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                  Legend
                </h3>
              </div>
              <div className="p-4 flex items-center gap-6 text-xs">
                <span className="flex items-center gap-1.5">
                  <StatusDot active />
                  <span className="text-zinc-600 dark:text-zinc-400">Service operational</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <StatusDot active={false} />
                  <span className="text-zinc-600 dark:text-zinc-400">Service unavailable</span>
                </span>
                <span className="font-mono text-zinc-400 dark:text-zinc-600">Values in monospace</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
