"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Wrench, Database, HardDrive, ShieldAlert, RefreshCw, Trash2, Download, CheckCircle2 } from "lucide-react"

function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
          {label}
        </p>
        {description && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 flex items-center px-0.5 border-2 transition-colors shrink-0 ${
          checked
            ? "border-rose-600 bg-rose-600 justify-end"
            : "border-zinc-300 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 justify-start"
        }`}
      >
        <span className="size-4 bg-white" />
      </button>
    </div>
  )
}

export default function MaintenanceSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceNotice, setMaintenanceNotice] = useState(
    "Scheduled platform maintenance in progress. Purchasing will resume shortly."
  )
  const [backingUp, setBackingUp] = useState(false)
  const [flushingCache, setFlushingCache] = useState(false)
  const [rebuildingIndex, setRebuildingIndex] = useState(false)

  const [backups, setBackups] = useState([
    { id: "bk_109", filename: "mymed_db_backup_20260805_0200.sql.gz", size: "142 MB", date: "2026-08-05 02:00 EAT", type: "AUTOMATED" },
    { id: "bk_108", filename: "mymed_db_backup_20260804_0200.sql.gz", size: "138 MB", date: "2026-08-04 02:00 EAT", type: "AUTOMATED" },
    { id: "bk_107", filename: "mymed_db_backup_20260801_manual.sql.gz", size: "135 MB", date: "2026-08-01 14:22 EAT", type: "MANUAL" },
  ])

  const handleToggleMaintenance = (val: boolean) => {
    setMaintenanceMode(val)
    if (val) {
      toast.warning("Platform Maintenance Mode ACTIVATED")
    } else {
      toast.success("Platform Maintenance Mode DEACTIVATED - Site is Live")
    }
  }

  const handleTriggerBackup = async () => {
    setBackingUp(true)
    await new Promise((res) => setTimeout(res, 800))
    setBackingUp(false)
    const newBk = {
      id: `bk_${Date.now()}`,
      filename: `mymed_db_backup_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_manual.sql.gz`,
      size: "144 MB",
      date: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} EAT`,
      type: "MANUAL",
    }
    setBackups([newBk, ...backups])
    toast.success("PostgreSQL database snapshot backup generated")
  }

  const handleFlushCache = async () => {
    setFlushingCache(true)
    await new Promise((res) => setTimeout(res, 600))
    setFlushingCache(false)
    toast.success("Redis cache keys flushed successfully")
  }

  const handleRebuildIndex = async () => {
    setRebuildingIndex(true)
    await new Promise((res) => setTimeout(res, 900))
    setRebuildingIndex(false)
    toast.success("Search index rebuilt across 2,400 catalog products")
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl pb-12">
        <SettingsHeader
          title="Platform Maintenance Settings"
          description="Emergency site maintenance lock, database snapshot backups, Redis cache flushes, and search index rebuilds"
        />

        <div className="space-y-6">
          {/* Emergency Maintenance Mode */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Wrench className="h-3.5 w-3.5 text-zinc-500" /> Emergency Maintenance Mode Lock
              </h3>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 border ${
                maintenanceMode
                  ? "text-rose-600 bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-800"
                  : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800"
              }`}>
                {maintenanceMode ? "MAINTENANCE ACTIVE" : "PLATFORM LIVE"}
              </span>
            </div>
            <div className="p-4 space-y-4">
              <ToggleSwitch
                label="Activate Maintenance Mode Lockout"
                description="Restricts marketplace ordering for buyers and vendor store edits while admin access remains open"
                checked={maintenanceMode}
                onChange={handleToggleMaintenance}
              />

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium mb-1">
                  Public Maintenance Notice Message
                </label>
                <Input
                  type="text"
                  value={maintenanceNotice}
                  onChange={(e) => setMaintenanceNotice(e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Database Backup & Snapshots */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-zinc-500" /> PostgreSQL Database Backups & Snapshots
              </h3>
              <button
                type="button"
                onClick={handleTriggerBackup}
                disabled={backingUp}
                className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 disabled:opacity-40"
              >
                {backingUp ? "Creating Snapshot..." : "+ Trigger Manual Backup"}
              </button>
            </div>
            <div className="p-4 space-y-2">
              {backups.map((bk) => (
                <div
                  key={bk.id}
                  className="flex items-center justify-between p-2.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
                >
                  <div>
                    <p className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">{bk.filename}</p>
                    <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                      Size: {bk.size} • Created: {bk.date} • Type: {bk.type}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.success(`Downloading ${bk.filename}`)}
                    className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 text-[10px] font-semibold uppercase"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cache & Index Operations */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <HardDrive className="h-3.5 w-3.5 text-zinc-500" /> Cache & Search Index Operations
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Flush Redis In-Memory Cache
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Clears cached product listings, session tokens, and rate limit counters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFlushCache}
                  disabled={flushingCache}
                  className="mt-3 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 border border-zinc-800 dark:border-zinc-200 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 self-start"
                >
                  {flushingCache ? "Flushing..." : "Flush Redis Cache"}
                </button>
              </div>

              <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Rebuild Catalog Search Index
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Re-indexes all active products and medical classifications for full-text search.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRebuildIndex}
                  disabled={rebuildingIndex}
                  className="mt-3 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 border border-zinc-800 dark:border-zinc-200 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 self-start"
                >
                  {rebuildingIndex ? "Rebuilding..." : "Rebuild Search Index"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
