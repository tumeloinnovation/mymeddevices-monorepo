"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Key, Bot, ShieldCheck, Webhook, Plus, Copy, Trash2, CheckCircle2 } from "lucide-react"

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

export default function IntegrationsSettingsPage() {
  const [saving, setSaving] = useState(false)

  const [aiData, setAiData] = useState({
    geminiKey: "AIzaSy_live_998102938102938109238",
    model: "gemini-1.5-flash",
    maxTokens: 2048,
    temperature: 0.2,
  })

  const [regulatoryData, setRegulatoryData] = useState({
    ppbEndpoint: "https://api.pharmacyboardkenya.org/v1/verify",
    ppbApiKey: "ppb_live_88410293",
    kmpdbEndpoint: "https://kmpdb.go.ke/api/v2/practitioners",
  })

  const [webhooks, setWebhooks] = useState([
    { id: "wh_1", url: "https://analytics.mymeddevices.co.ke/events", events: ["order.placed", "payment.completed"], active: true },
    { id: "wh_2", url: "https://erp.medicaldistributors.co.ke/webhook", events: ["vendor.approved"], active: true },
  ])
  const [newWebhookUrl, setNewWebhookUrl] = useState("")

  const [apiKeys, setApiKeys] = useState([
    { id: "ak_1", name: "ERP System Sync Script", keyPrefix: "mmd_live_8a...", created: "2026-07-15", lastUsed: "10 mins ago" },
    { id: "ak_2", name: "Warehouse Dispatch Webhook", keyPrefix: "mmd_live_3f...", created: "2026-08-01", lastUsed: "1 hour ago" },
  ])

  const handleAiChange = (key: string, val: any) => {
    setAiData((prev) => ({ ...prev, [key]: val }))
  }

  const handleRegulatoryChange = (key: string, val: any) => {
    setRegulatoryData((prev) => ({ ...prev, [key]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((res) => setTimeout(res, 500))
    setSaving(false)
    toast.success("API & Integration settings saved")
  }

  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWebhookUrl) return
    setWebhooks([
      ...webhooks,
      { id: `wh_${Date.now()}`, url: newWebhookUrl, events: ["order.placed"], active: true },
    ])
    setNewWebhookUrl("")
    toast.success("Webhook endpoint registered")
  }

  const handleGenerateApiKey = () => {
    const newKey = {
      id: `ak_${Date.now()}`,
      name: "New Admin Integration Key",
      keyPrefix: `mmd_live_${Math.random().toString(36).substring(2, 6)}...`,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
    }
    setApiKeys([...apiKeys, newKey])
    toast.success("New secret API key generated")
  }

  const handleCopyKey = (prefix: string) => {
    navigator.clipboard.writeText(prefix)
    toast.success("Key prefix copied to clipboard")
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl pb-12">
        <SettingsHeader
          title="API & Integrations Settings"
          description="Regulatory medical board verification APIs, Google Gemini AI engine keys, webhooks, and admin secret keys"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Regulatory Databases */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" /> Kenya Medical Regulatory Database APIs
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5">
                PPB & KMPDB SYNC ACTIVE
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldWrap label="Pharmacy and Poisons Board (PPB) Sync Endpoint">
                <Input
                  type="text"
                  value={regulatoryData.ppbEndpoint}
                  onChange={(e) => handleRegulatoryChange("ppbEndpoint", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>

              <FieldWrap label="PPB Verification API Key">
                <Input
                  type="password"
                  value={regulatoryData.ppbApiKey}
                  onChange={(e) => handleRegulatoryChange("ppbApiKey", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>

              <FieldWrap label="KMPDB Medical Practitioners Verification Endpoint" helpText="Validates doctor and clinic license registrations">
                <Input
                  type="text"
                  value={regulatoryData.kmpdbEndpoint}
                  onChange={(e) => handleRegulatoryChange("kmpdbEndpoint", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>
            </div>
          </div>

          {/* AI Assistant (Google Gemini) */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Bot className="h-3.5 w-3.5 text-zinc-500" /> AI Assistant Service (Google Gemini)
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">MODEL: GEMINI 1.5 FLASH</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldWrap label="Google Gemini API Key">
                <Input
                  type="password"
                  value={aiData.geminiKey}
                  onChange={(e) => handleAiChange("geminiKey", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>

              <FieldWrap label="Gemini AI Model Selector">
                <select
                  value={aiData.model}
                  onChange={(e) => handleAiChange("model", e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-mono focus:outline-none"
                >
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Efficient)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (High Precision Medical Reasoning)</option>
                </select>
              </FieldWrap>

              <FieldWrap label="Temperature (Creativity)">
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={aiData.temperature}
                  onChange={(e) => handleAiChange("temperature", parseFloat(e.target.value) || 0.2)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>
            </div>
          </div>

          {/* Webhooks Manager */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Webhook className="h-3.5 w-3.5 text-zinc-500" /> Outgoing System Webhooks
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://your-domain.com/webhooks"
                  className="rounded-none border-2 text-xs font-mono flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddWebhook}
                  className="text-xs font-semibold uppercase tracking-widest px-4 py-2 border-2 border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 shrink-0"
                >
                  Register Webhook
                </button>
              </div>

              <div className="space-y-2">
                {webhooks.map((wh) => (
                  <div
                    key={wh.id}
                    className="flex items-center justify-between p-2.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
                  >
                    <div>
                      <p className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">{wh.url}</p>
                      <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">Events: {wh.events.join(", ")}</p>
                    </div>
                    <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 border border-emerald-300 dark:border-emerald-800">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Admin Secret API Keys */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-zinc-500" /> Platform Admin API Keys ({apiKeys.length})
              </h3>
              <button
                type="button"
                onClick={handleGenerateApiKey}
                className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
              >
                + Generate Secret Key
              </button>
            </div>
            <div className="p-4 space-y-2">
              {apiKeys.map((ak) => (
                <div
                  key={ak.id}
                  className="flex items-center justify-between p-2.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
                >
                  <div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{ak.name}</p>
                    <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                      Prefix: {ak.keyPrefix} • Created: {ak.created} • Last Used: {ak.lastUsed}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyKey(ak.keyPrefix)}
                    className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                    title="Copy Key Prefix"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Third-party APIs use retry fallback circuits.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="text-xs font-semibold uppercase tracking-widest px-5 py-2.5 border-2 border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving Integrations..." : "Save Integrations Settings"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
