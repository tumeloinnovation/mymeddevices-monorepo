"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Building2, Mail, Phone, MapPin, DollarSign, Activity } from "lucide-react"

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

export default function GeneralSettingsPage() {
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    platformName: "MyMedDevices Kenya",
    legalName: "Tumelo Medical Devices Limited",
    kraPin: "P051938210Z",
    registrationNo: "PVT-MKU9942",
    supportEmail: "support@mymeddevices.co.ke",
    hotline: "+254 700 123 456",
    officeAddress: "HQ Medical Tower, Suite 402, Upper Hill, Nairobi",
    businessHours: "Mon - Sat: 08:00 - 18:00 EAT",
    defaultCommission: 8.5,
    standardVat: 16.0,
    minOrderValue: 5000,
    operationalMode: "LIVE",
  })

  const handleChange = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((res) => setTimeout(res, 400))
    setSaving(false)
    toast.success("General settings updated successfully")
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl pb-12">
        <SettingsHeader
          title="General Settings"
          description="Global platform identity, contact parameters, and marketplace financial rules"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Platform Identity */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-zinc-500" /> Platform & Legal Identity
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldWrap label="Platform Name">
                <Input
                  type="text"
                  value={formData.platformName}
                  onChange={(e) => handleChange("platformName", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>
              <FieldWrap label="Legal Registered Business Entity">
                <Input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) => handleChange("legalName", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>
              <FieldWrap label="KRA Tax PIN">
                <Input
                  type="text"
                  value={formData.kraPin}
                  onChange={(e) => handleChange("kraPin", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono uppercase"
                  required
                />
              </FieldWrap>
              <FieldWrap label="BRS Registration Number">
                <Input
                  type="text"
                  value={formData.registrationNo}
                  onChange={(e) => handleChange("registrationNo", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono uppercase"
                  required
                />
              </FieldWrap>
            </div>
          </div>

          {/* Customer Support & Contact Details */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-zinc-500" /> Support Desk & Operating Address
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldWrap label="Official Support Email">
                <Input
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => handleChange("supportEmail", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>
              <FieldWrap label="Emergency Hotline Phone">
                <Input
                  type="text"
                  value={formData.hotline}
                  onChange={(e) => handleChange("hotline", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>
              <FieldWrap label="Nairobi Head Office Address">
                <Input
                  type="text"
                  value={formData.officeAddress}
                  onChange={(e) => handleChange("officeAddress", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs"
                  required
                />
              </FieldWrap>
              <FieldWrap label="Operational Business Hours">
                <Input
                  type="text"
                  value={formData.businessHours}
                  onChange={(e) => handleChange("businessHours", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>
            </div>
          </div>

          {/* Financial Parameters */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-zinc-500" /> Financial & Tax Parameters
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldWrap label="Default Platform Commission (%)" helpText="Applied to seller gross order items">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={formData.defaultCommission}
                  onChange={(e) => handleChange("defaultCommission", parseFloat(e.target.value) || 0)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>
              <FieldWrap label="Standard Kenya VAT Rate (%)" helpText="Standard statutory value added tax">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={formData.standardVat}
                  onChange={(e) => handleChange("standardVat", parseFloat(e.target.value) || 0)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>
              <FieldWrap label="Minimum Order Value (KES)" helpText="Minimum checkout threshold">
                <Input
                  type="number"
                  step="100"
                  min="0"
                  value={formData.minOrderValue}
                  onChange={(e) => handleChange("minOrderValue", parseInt(e.target.value) || 0)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>
            </div>
          </div>

          {/* Operational Mode */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-zinc-500" /> Platform Operational Mode
              </h3>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5">
                STATUS: {formData.operationalMode}
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { mode: "LIVE", title: "Live Marketplace Mode", desc: "Full purchasing, M-Pesa payments, and vendor disbursements active." },
                { mode: "MAINTENANCE", title: "Maintenance Banner Mode", desc: "Show maintenance banner to buyers while admin operations continue." },
                { mode: "SANDBOX", title: "Testing Sandbox Mode", desc: "Simulate M-Pesa STK push and mock carrier shipping rates." },
              ].map((item) => (
                <button
                  type="button"
                  key={item.mode}
                  onClick={() => handleChange("operationalMode", item.mode)}
                  className={`p-3 text-left border-2 transition-all ${
                    formData.operationalMode === item.mode
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-400"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider">{item.title}</p>
                  <p className="text-[11px] opacity-80 mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Changes apply immediately across all portal microservices.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="text-xs font-semibold uppercase tracking-widest px-5 py-2.5 border-2 border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving Changes..." : "Save General Settings"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
