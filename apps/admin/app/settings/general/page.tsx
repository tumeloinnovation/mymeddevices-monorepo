"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Building2, Mail, DollarSign, Activity, RefreshCw } from "lucide-react"
import { systemService, type GeneralSettings } from "@mymeddevices/shared-core"

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
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<GeneralSettings>({
    site_name: "MyMedDevices Kenya",
    site_tagline: "Certified Medical Equipment Marketplace in Kenya",
    support_email: "support@mymeddevices.co.ke",
    support_phone: "+254 700 123 456",
    currency: "KES",
    currency_symbol: "KSh",
    timezone: "Africa/Nairobi",
    maintenance_mode: false,
    allow_guest_checkout: true,
    order_prefix: "MMD-",
    vat_percentage: 16.0,
    address: "HQ Medical Tower, Upper Hill, Nairobi",
  })

  const { data: remoteSettings, isLoading, isError } = useQuery<GeneralSettings>({
    queryKey: ["system", "general-settings"],
    queryFn: () => systemService.getGeneralSettings(),
  })

  useEffect(() => {
    if (remoteSettings) {
      setFormData((prev) => ({ ...prev, ...remoteSettings }))
    }
  }, [remoteSettings])

  const mutation = useMutation({
    mutationFn: (updated: Partial<GeneralSettings>) => systemService.updateGeneralSettings(updated),
    onSuccess: (savedData) => {
      queryClient.setQueryData(["system", "general-settings"], savedData)
      toast.success("General platform settings saved to database")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save settings")
    },
  })

  const handleChange = (key: keyof GeneralSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl pb-12">
        <SettingsHeader
          title="General Settings"
          description="Global platform identity, contact parameters, and marketplace financial rules"
        />

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading system settings...
          </div>
        ) : (
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
                    value={formData.site_name}
                    onChange={(e) => handleChange("site_name", e.target.value)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    required
                  />
                </FieldWrap>
                <FieldWrap label="Platform Tagline">
                  <Input
                    type="text"
                    value={formData.site_tagline || ""}
                    onChange={(e) => handleChange("site_tagline", e.target.value)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    required
                  />
                </FieldWrap>
                <FieldWrap label="Order Prefix">
                  <Input
                    type="text"
                    value={formData.order_prefix}
                    onChange={(e) => handleChange("order_prefix", e.target.value)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono uppercase"
                    required
                  />
                </FieldWrap>
                <FieldWrap label="Default Timezone">
                  <Input
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => handleChange("timezone", e.target.value)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
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
                    value={formData.support_email}
                    onChange={(e) => handleChange("support_email", e.target.value)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    required
                  />
                </FieldWrap>
                <FieldWrap label="Emergency Hotline Phone">
                  <Input
                    type="text"
                    value={formData.support_phone}
                    onChange={(e) => handleChange("support_phone", e.target.value)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    required
                  />
                </FieldWrap>
                <FieldWrap label="Nairobi Head Office Address">
                  <Input
                    type="text"
                    value={formData.address || ""}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs"
                    required
                  />
                </FieldWrap>
                <FieldWrap label="Operating Currency">
                  <Input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono uppercase"
                    required
                  />
                </FieldWrap>
              </div>
            </div>

            {/* Financial Parameters */}
            <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-zinc-500" /> Financial & Statutory Tax Rules
                </h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWrap label="Standard Kenya VAT Rate (%)" helpText="Standard statutory value added tax">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={formData.vat_percentage || 16}
                    onChange={(e) => handleChange("vat_percentage", parseFloat(e.target.value) || 0)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    required
                  />
                </FieldWrap>
                <FieldWrap label="Allow Guest Checkout" helpText="Allow doctors and buyers to order without an account">
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange("allow_guest_checkout", !formData.allow_guest_checkout)}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase border-2 ${
                        formData.allow_guest_checkout
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                          : "border-zinc-300 text-zinc-500"
                      }`}
                    >
                      {formData.allow_guest_checkout ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </FieldWrap>
              </div>
            </div>

            {/* Operational Mode */}
            <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-zinc-500" /> Platform Maintenance Mode
                </h3>
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border ${
                  formData.maintenance_mode 
                    ? "text-rose-600 bg-rose-50 border-rose-300 dark:bg-rose-950/40" 
                    : "text-emerald-600 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40"
                }`}>
                  STATUS: {formData.maintenance_mode ? "MAINTENANCE ACTIVE" : "LIVE OPERATION"}
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange("maintenance_mode", false)}
                  className={`p-3 text-left border-2 transition-all ${
                    !formData.maintenance_mode
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-400"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider">Live Marketplace</p>
                  <p className="text-[11px] opacity-80 mt-1">Full purchasing, M-Pesa STK payments, and seller orders active.</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleChange("maintenance_mode", true)}
                  className={`p-3 text-left border-2 transition-all ${
                    formData.maintenance_mode
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-400"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider">Maintenance Mode</p>
                  <p className="text-[11px] opacity-80 mt-1">Display maintenance banner to customers during schema upgrades.</p>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Changes persist directly to the central PostgreSQL system settings.
              </span>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="text-xs font-semibold uppercase tracking-widest px-5 py-2.5 border-2 border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
              >
                {mutation.isPending ? "Saving..." : "Save General Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
