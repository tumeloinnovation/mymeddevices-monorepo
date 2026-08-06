"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Bell, Mail, Smartphone, AlertTriangle, Send, Check } from "lucide-react"

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
            ? "border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100 justify-end"
            : "border-zinc-300 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 justify-start"
        }`}
      >
        <span
          className={`size-4 transition-colors ${
            checked
              ? "bg-white dark:bg-zinc-900"
              : "bg-zinc-500 dark:bg-zinc-400"
          }`}
        />
      </button>
    </div>
  )
}

export default function NotificationsSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [testTarget, setTestTarget] = useState("admin@mymeddevices.co.ke")
  const [testing, setTesting] = useState(false)

  const [toggles, setToggles] = useState({
    emailAlerts: true,
    smsAlerts: true,
    dashboardToasts: true,
    newOrderAlert: true,
    highValueOrderAlert: true,
    orderCancelAlert: true,
    vendorApplicationAlert: true,
    vendorExpiryAlert: true,
    storeSuspensionAlert: true,
    lowStockAlert: true,
    outOfStockAlert: true,
    dailyDigest: true,
    weeklyLedger: false,
  })

  const [lowStockThreshold, setLowStockThreshold] = useState(10)

  const handleToggle = (key: keyof typeof toggles, val: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: val }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((res) => setTimeout(res, 400))
    setSaving(false)
    toast.success("Notification preferences updated")
  }

  const handleSendTestNotification = async () => {
    if (!testTarget) return
    setTesting(true)
    await new Promise((res) => setTimeout(res, 600))
    setTesting(false)
    toast.success(`Test notification dispatched to ${testTarget}`)
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl pb-12">
        <SettingsHeader
          title="Notification Settings"
          description="Configure system alert channels, event triggers, and executive email digest schedules"
        />

        <form onSubmit={handleSave} className="space-y-6">
          {/* Dispatch Channels */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-zinc-500" /> Active Alert Dispatch Channels
              </h3>
            </div>
            <div className="p-2">
              <ToggleSwitch
                label="System Email Alerts"
                description="Send urgent transactional notifications to administrative email addresses"
                checked={toggles.emailAlerts}
                onChange={(val) => handleToggle("emailAlerts", val)}
              />
              <ToggleSwitch
                label="SMS Gateway Dispatch"
                description="Send critical SMS notifications to assigned admin phone numbers"
                checked={toggles.smsAlerts}
                onChange={(val) => handleToggle("smsAlerts", val)}
              />
              <ToggleSwitch
                label="Real-time Admin Dashboard Toasts"
                description="Display live pop-up indicators on active admin sessions"
                checked={toggles.dashboardToasts}
                onChange={(val) => handleToggle("dashboardToasts", val)}
              />
            </div>
          </div>

          {/* Order Event Triggers */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-zinc-500" /> Order Event Notification Triggers
              </h3>
            </div>
            <div className="p-2">
              <ToggleSwitch
                label="New Customer Order Placed"
                description="Notify when a new purchase order is completed"
                checked={toggles.newOrderAlert}
                onChange={(val) => handleToggle("newOrderAlert", val)}
              />
              <ToggleSwitch
                label="High-Value Procurement Alert (> KES 500,000)"
                description="Priority broadcast for high volume institutional equipment orders"
                checked={toggles.highValueOrderAlert}
                onChange={(val) => handleToggle("highValueOrderAlert", val)}
              />
              <ToggleSwitch
                label="Order Cancellation Request"
                description="Alert when an order cancellation or refund request is submitted"
                checked={toggles.orderCancelAlert}
                onChange={(val) => handleToggle("orderCancelAlert", val)}
              />
            </div>
          </div>

          {/* Vendor Compliance Events */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Smartphone className="h-3.5 w-3.5 text-zinc-500" /> Vendor Moderation & Compliance Triggers
              </h3>
            </div>
            <div className="p-2">
              <ToggleSwitch
                label="New Vendor Onboarding Application"
                description="Notify admin team when a seller submits store registration for review"
                checked={toggles.vendorApplicationAlert}
                onChange={(val) => handleToggle("vendorApplicationAlert", val)}
              />
              <ToggleSwitch
                label="KMPDB / PPB License Expiry Warning"
                description="Alert 30 days prior to vendor medical regulatory license expiration"
                checked={toggles.vendorExpiryAlert}
                onChange={(val) => handleToggle("vendorExpiryAlert", val)}
              />
              <ToggleSwitch
                label="Store Suspension or Penalty Trigger"
                description="Broadcast when a seller account is flagged for non-fulfillment"
                checked={toggles.storeSuspensionAlert}
                onChange={(val) => handleToggle("storeSuspensionAlert", val)}
              />
            </div>
          </div>

          {/* Stock Thresholds */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-zinc-500" /> Inventory & Stock Alerts
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium mb-1">
                  Global Low Stock Threshold (Units)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 1)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono max-w-xs"
                />
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                  Trigger low stock alerts when product inventory drops below this number.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <ToggleSwitch
                  label="Emergency Out-of-Stock Broadcast"
                  description="Immediate notification when critical life-support items reach 0 stock"
                  checked={toggles.outOfStockAlert}
                  onChange={(val) => handleToggle("outOfStockAlert", val)}
                />
              </div>
            </div>
          </div>

          {/* Test Dispatch Tool */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Send className="h-3.5 w-3.5 text-zinc-500" /> Test Notification Dispatcher
              </h3>
            </div>
            <div className="p-4 flex flex-col md:flex-row items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium mb-1">
                  Target Recipient Email / Phone
                </label>
                <Input
                  type="text"
                  value={testTarget}
                  onChange={(e) => setTestTarget(e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  placeholder="admin@mymeddevices.co.ke"
                />
              </div>
              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={testing || !testTarget}
                className="text-xs font-semibold uppercase tracking-widest px-4 py-2 border-2 border-zinc-800 dark:border-zinc-200 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors shrink-0"
              >
                {testing ? "Dispatching..." : "Send Test Ping"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Configured notification rules apply across all active admin accounts.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="text-xs font-semibold uppercase tracking-widest px-5 py-2.5 border-2 border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving Preferences..." : "Save Notification Settings"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
