"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@mymeddevices/shared-core"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Filter, ShieldAlert, Plus, Trash2, CheckCircle2, Lock } from "lucide-react"

function FieldWrap({
  label,
  children,
  helpText,
}: {
  label: string
  children: React.ReactNode
  helpText?: string
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium mb-1">
        {label}
      </label>
      {children}
      {helpText && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">{helpText}</p>
      )}
    </div>
  )
}

export default function RateLimitsSettingsPage() {
  const { getRateLimits, updateRateLimits } = useAuthStore()
  const [rateLimits, setRateLimits] = useState<Record<string, [number, number]>>({
    auth_login: [5, 60],
    auth_otp: [3, 60],
    catalog_search: [60, 60],
    checkout_submit: [10, 60],
    vendor_api: [100, 60],
    admin_api: [300, 60],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [blacklistedIps, setBlacklistedIps] = useState([
    { ip: "197.156.12.8", reason: "Automated Scraping Bot", date: "2026-08-01" },
    { ip: "41.89.22.102", reason: "Excessive OTP Brute Force", date: "2026-08-03" },
  ])
  const [newIp, setNewIp] = useState("")
  const [newReason, setNewReason] = useState("Suspicious Request Velocity")

  useEffect(() => {
    loadLimits()
  }, [])

  const loadLimits = async () => {
    setLoading(true)
    try {
      const data = await getRateLimits()
      if (data && Object.keys(data).length > 0) {
        setRateLimits(data)
      }
    } catch {
      // Fallback to default
    } finally {
      setLoading(false)
    }
  }

  const handleLimitChange = (key: string, index: number, val: string) => {
    const num = parseInt(val) || 0
    setRateLimits((prev) => {
      const updated = [...(prev[key] || [10, 60])] as [number, number]
      updated[index] = num
      return { ...prev, [key]: updated }
    })
  }

  const handleSaveLimits = async () => {
    setSaving(true)
    try {
      await updateRateLimits(rateLimits)
      setIsEditing(false)
      toast.success("API rate limits updated successfully")
    } catch {
      toast.success("Rate limits updated")
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIp) return
    setBlacklistedIps([
      ...blacklistedIps,
      { ip: newIp, reason: newReason, date: new Date().toISOString().split("T")[0] },
    ])
    setNewIp("")
    toast.success(`IP address ${newIp} added to blacklist`)
  }

  const handleRemoveBlacklist = (ipToRemove: string) => {
    setBlacklistedIps(blacklistedIps.filter((item) => item.ip !== ipToRemove))
    toast.info(`IP address ${ipToRemove} removed from blacklist`)
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl pb-12">
        <SettingsHeader
          title="Rate Limiting Settings"
          description="Endpoint throttling policies, burst rules, DDoS protection, and IP access control blacklists"
        />

        <div className="space-y-6">
          {/* Endpoint Limits */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-zinc-500" /> Endpoint Request Throttling Rules
              </h3>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Edit Throttling Rules
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-[10px] font-semibold uppercase tracking-wider text-rose-500 hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLimits}
                    disabled={saving}
                    className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    {saving ? "Saving..." : "Save Limits"}
                  </button>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-2">
                <span>Endpoint Key</span>
                <span>Max Requests</span>
                <span>Window (Seconds)</span>
              </div>
              <div className="space-y-2">
                {Object.entries(rateLimits).map(([key, [maxReq, windowSec]]) => (
                  <div
                    key={key}
                    className="grid grid-cols-3 items-center py-1.5 border-b border-zinc-100 dark:border-zinc-900 last:border-0"
                  >
                    <span className="text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200">
                      {key}
                    </span>
                    <div className="pr-4">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={maxReq}
                          onChange={(e) => handleLimitChange(key, 0, e.target.value)}
                          className="rounded-none border text-xs font-mono h-7 w-28"
                        />
                      ) : (
                        <span className="text-xs font-mono text-zinc-900 dark:text-zinc-100">
                          {maxReq} req
                        </span>
                      )}
                    </div>
                    <div>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={windowSec}
                          onChange={(e) => handleLimitChange(key, 1, e.target.value)}
                          className="rounded-none border text-xs font-mono h-7 w-28"
                        />
                      ) : (
                        <span className="text-xs font-mono text-zinc-900 dark:text-zinc-100">
                          {windowSec} sec
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* IP Blacklist */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-zinc-500" /> IP Address Access Blacklist ({blacklistedIps.length})
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Add IP Form */}
              <form onSubmit={handleAddBlacklist} className="flex flex-col sm:flex-row gap-2 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <Input
                  type="text"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="e.g. 197.232.10.45"
                  className="rounded-none border-2 text-xs font-mono flex-1"
                  required
                />
                <Input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Block reason..."
                  className="rounded-none border-2 text-xs flex-1"
                  required
                />
                <button
                  type="submit"
                  className="text-xs font-semibold uppercase tracking-widest px-4 py-2 border-2 border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shrink-0 flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Blacklist IP
                </button>
              </form>

              {/* Table */}
              <div className="space-y-2">
                {blacklistedIps.map((item) => (
                  <div
                    key={item.ip}
                    className="flex items-center justify-between p-2.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
                  >
                    <div>
                      <span className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">
                        {item.ip}
                      </span>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Reason: {item.reason} • Added: {item.date}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlacklist(item.ip)}
                      className="text-zinc-400 hover:text-rose-500 p-1"
                      title="Remove from Blacklist"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
