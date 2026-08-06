"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Globe, Clock, DollarSign, RefreshCw, Eye } from "lucide-react"

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

export default function LocalizationSettingsPage() {
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    primaryCurrency: "KES",
    currencySymbol: "KES",
    defaultLocale: "en-KE",
    timezone: "Africa/Nairobi",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24",
    thousandSeparator: ",",
    usdRate: 129.50,
    eurRate: 140.20,
    gbpRate: 165.80,
  })

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((res) => setTimeout(res, 500))
    setSaving(false)
    toast.success("Localization preferences updated successfully")
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl pb-12">
        <SettingsHeader
          title="Localization Settings"
          description="Regional language, currency parameters, date/time formatting, and foreign exchange conversion rates"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Regional Defaults */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-zinc-500" /> Regional Locale & Currency
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldWrap label="Primary Base Currency">
                <select
                  value={formData.primaryCurrency}
                  onChange={(e) => handleChange("primaryCurrency", e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-mono focus:outline-none"
                >
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="UGX">UGX - Ugandan Shilling</option>
                  <option value="TZS">TZS - Tanzanian Shilling</option>
                </select>
              </FieldWrap>

              <FieldWrap label="Default Locale / Language">
                <select
                  value={formData.defaultLocale}
                  onChange={(e) => handleChange("defaultLocale", e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-mono focus:outline-none"
                >
                  <option value="en-KE">English (Kenya) - en-KE</option>
                  <option value="sw-KE">Kiswahili (Kenya) - sw-KE</option>
                  <option value="en-US">English (US) - en-US</option>
                </select>
              </FieldWrap>

              <FieldWrap label="System Timezone">
                <select
                  value={formData.timezone}
                  onChange={(e) => handleChange("timezone", e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-mono focus:outline-none"
                >
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT UTC+3)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                </select>
              </FieldWrap>
            </div>
          </div>

          {/* Display & Formatting Rules */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-zinc-500" /> Date, Time & Numeric Formatting
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldWrap label="Date Format">
                <select
                  value={formData.dateFormat}
                  onChange={(e) => handleChange("dateFormat", e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-mono focus:outline-none"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (05/08/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2026-08-05)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (08/05/2026)</option>
                </select>
              </FieldWrap>

              <FieldWrap label="Time Display Mode">
                <select
                  value={formData.timeFormat}
                  onChange={(e) => handleChange("timeFormat", e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-mono focus:outline-none"
                >
                  <option value="24">24-Hour Clock (21:42 EAT)</option>
                  <option value="12">12-Hour Clock (09:42 PM EAT)</option>
                </select>
              </FieldWrap>

              <FieldWrap label="Thousand Separator">
                <select
                  value={formData.thousandSeparator}
                  onChange={(e) => handleChange("thousandSeparator", e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-mono focus:outline-none"
                >
                  <option value=",">Comma (1,250,000.00 KES)</option>
                  <option value=" ">Space (1 250 000.00 KES)</option>
                </select>
              </FieldWrap>
            </div>

            {/* Live Format Preview */}
            <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-4 text-xs">
              <span className="font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Formatting Preview:
              </span>
              <div className="flex items-center gap-4 font-mono text-zinc-900 dark:text-zinc-100">
                <span>Price: KES 1,450,000.00</span>
                <span>Date: {formData.dateFormat === "DD/MM/YYYY" ? "05/08/2026" : "2026-08-05"}</span>
                <span>Time: {formData.timeFormat === "24" ? "21:42 EAT" : "09:42 PM EAT"}</span>
              </div>
            </div>
          </div>

          {/* Foreign Exchange Conversion Rates */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-zinc-500" /> Foreign Exchange Rates (to KES)
              </h3>
              <button
                type="button"
                onClick={() => toast.success("Exchange rates synced with Central Bank of Kenya (CBK)")}
                className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Sync CBK Rates
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldWrap label="USD to KES Rate">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.usdRate}
                  onChange={(e) => handleChange("usdRate", parseFloat(e.target.value) || 0)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>

              <FieldWrap label="EUR to KES Rate">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.eurRate}
                  onChange={(e) => handleChange("eurRate", parseFloat(e.target.value) || 0)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>

              <FieldWrap label="GBP to KES Rate">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.gbpRate}
                  onChange={(e) => handleChange("gbpRate", parseFloat(e.target.value) || 0)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Exchange rates update cross-border vendor item displays.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="text-xs font-semibold uppercase tracking-widest px-5 py-2.5 border-2 border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving Localization..." : "Save Localization Settings"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
