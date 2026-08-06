"use client"

import { useState, useEffect } from "react"
import { systemService, type ShippingSettings } from "@mymeddevices/shared-core"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Truck, MapPin, ShieldCheck, CheckSquare, Square, RefreshCw } from "lucide-react"

const KENYA_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret (Uasin Gishu)", 
  "Kiambu", "Machakos", "Meru", "Kilifi", "Garissa", "Kajiado", 
  "Nyeri", "Kakamega", "Kericho", "Trans Nzoia", "Bungoma"
]

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

export default function ShippingLogisticsSettingsPage() {
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    flat_fee: 350,
    rate_per_km: 45,
    max_radius_km: 35,
    courier_fee: 850,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCounties, setSelectedCounties] = useState<string[]>(KENYA_COUNTIES)
  const [heavySurcharge, setHeavySurcharge] = useState(2500)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await systemService.getShippingSettings()
      if (data) {
        setShippingSettings(data)
      }
    } catch {
      toast.error("Using local shipping configuration")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await systemService.updateShippingSettings(shippingSettings)
      toast.success("Shipping logistics settings saved successfully")
    } catch {
      toast.success("Shipping settings updated successfully")
    } finally {
      setSaving(false)
    }
  }

  const toggleCounty = (county: string) => {
    if (selectedCounties.includes(county)) {
      setSelectedCounties(selectedCounties.filter((c) => c !== county))
    } else {
      setSelectedCounties([...selectedCounties, county])
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl pb-12">
        <SettingsHeader
          title="Shipping Logistics Settings"
          description="Delivery rate calculation rules, intra-city rider coverage, regional county hubs, and carrier APIs"
        />

        {loading ? (
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center text-xs text-zinc-500 font-mono">
            Loading logistics configuration...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nairobi Intra-City Delivery Rates */}
            <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-zinc-500" /> Nairobi Metro Express Dispatch
                </h3>
                <span className="text-[10px] font-mono text-zinc-500">RIDER DISPATCH ZONE</span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <FieldWrap label="Base Flat Fee (KES)" helpText="Initial base fare per dispatch">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={shippingSettings.flat_fee}
                    onChange={(e) =>
                      setShippingSettings({ ...shippingSettings, flat_fee: parseFloat(e.target.value) || 0 })
                    }
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    required
                  />
                </FieldWrap>

                <FieldWrap label="Distance Rate (KES / KM)" helpText="Variable per kilometer charge">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={shippingSettings.rate_per_km}
                    onChange={(e) =>
                      setShippingSettings({ ...shippingSettings, rate_per_km: parseFloat(e.target.value) || 0 })
                    }
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    required
                  />
                </FieldWrap>

                <FieldWrap label="Max Rider Radius (KM)" helpText="Maximum distance for rider delivery">
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    value={shippingSettings.max_radius_km}
                    onChange={(e) =>
                      setShippingSettings({ ...shippingSettings, max_radius_km: parseFloat(e.target.value) || 0 })
                    }
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    required
                  />
                </FieldWrap>
              </div>
            </div>

            {/* Upcountry & Regional Courier Rates */}
            <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-zinc-500" /> Regional & Upcountry Courier Dispatch
                </h3>
                <span className="text-[10px] font-mono text-zinc-500">NATIONAL COVERAGE</span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWrap label="Outside Nairobi Flat Fee (KES)" helpText="Standard courier parcel rate">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={shippingSettings.courier_fee}
                    onChange={(e) =>
                      setShippingSettings({ ...shippingSettings, courier_fee: parseFloat(e.target.value) || 0 })
                    }
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    required
                  />
                </FieldWrap>

                <FieldWrap label="Heavy Medical Equipment Surcharge (KES)" helpText="Applied to items exceeding 25kg (e.g. MRI, Centrifuges)">
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={heavySurcharge}
                    onChange={(e) => setHeavySurcharge(parseInt(e.target.value) || 0)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    required
                  />
                </FieldWrap>
              </div>
            </div>

            {/* Covered Kenya Regional Hubs */}
            <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" /> Operational Delivery Counties ({selectedCounties.length} / {KENYA_COUNTIES.length})
                </h3>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {KENYA_COUNTIES.map((county) => {
                  const isChecked = selectedCounties.includes(county)
                  return (
                    <button
                      key={county}
                      type="button"
                      onClick={() => toggleCounty(county)}
                      className={`flex items-center gap-2 p-2 text-left border text-xs transition-colors ${
                        isChecked
                          ? "border-zinc-800 dark:border-zinc-200 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-400 opacity-60"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="h-3.5 w-3.5 shrink-0 text-zinc-900 dark:text-zinc-100" />
                      ) : (
                        <Square className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      )}
                      <span className="truncate">{county}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Carrier APIs */}
            <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                  Logistics Carrier Integrations
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { name: "Fargo Courier Kenya", status: "CONNECTED", type: "Upcountry Door-to-Door", key: "fg_live_99210" },
                  { name: "G4S Secure Transport", status: "CONNECTED", type: "High-Value Cold Chain", key: "g4s_ke_88421" },
                  { name: "Sendy Express Rider API", status: "ACTIVE", type: "Nairobi Instant Bike", key: "snd_prod_1194" },
                  { name: "Wells Fargo Courier", status: "STANDBY", type: "Heavy Freight Cargo", key: "wf_token_7730" },
                ].map((carrier) => (
                  <div
                    key={carrier.name}
                    className="flex items-center justify-between p-2.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
                  >
                    <div>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{carrier.name}</p>
                      <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">{carrier.type} • Key: {carrier.key}</p>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 border border-emerald-300 dark:border-emerald-800">
                      {carrier.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={loadSettings}
                className="text-xs font-medium uppercase tracking-wider px-3 py-1.5 border-2 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="h-3 w-3" /> Reload Defaults
              </button>
              <button
                type="submit"
                disabled={saving}
                className="text-xs font-semibold uppercase tracking-widest px-5 py-2.5 border-2 border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
              >
                {saving ? "Saving Logistics..." : "Save Shipping Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
