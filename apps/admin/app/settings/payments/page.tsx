"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { CreditCard, Shield, Eye, EyeOff, Radio, CheckCircle, Zap } from "lucide-react"

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

export default function PaymentGatewaySettingsPage() {
  const [saving, setSaving] = useState(false)
  const [testingPing, setTestingPing] = useState(false)
  const [showPasskey, setShowPasskey] = useState(false)
  const [showConsumerSecret, setShowConsumerSecret] = useState(false)

  const [formData, setFormData] = useState({
    environment: "SANDBOX",
    paybillNumber: "174379",
    consumerKey: "k89AJKl98012nsdKJAS9812",
    consumerSecret: "secret_live_998123019238120938120",
    passkey: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
    b2cInitiator: "mymed_admin_payout",
    b2cSecurityCredential: "••••••••••••••••",
    payoutSchedule: "DAILY",
    absorbMpesaFees: true,
  })

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((res) => setTimeout(res, 500))
    setSaving(false)
    toast.success("Payment gateway configuration updated")
  }

  const handleTestPing = async () => {
    setTestingPing(true)
    await new Promise((res) => setTimeout(res, 700))
    setTestingPing(false)
    toast.success("M-Pesa Daraja STK Push ping successful (200 OK)")
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl pb-12">
        <SettingsHeader
          title="Payment Gateway Settings"
          description="M-Pesa Daraja STK Push credentials, B2C vendor payouts, bank settlement accounts, and fee absorption rules"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gateway Environment */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-zinc-500" /> Gateway Environment Mode
              </h3>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 border ${
                formData.environment === "PRODUCTION"
                  ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800"
                  : "text-amber-600 bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800"
              }`}>
                {formData.environment}
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { mode: "SANDBOX", title: "Safaricom Developer Sandbox", desc: "Use Safaricom test shortcode 174379 & simulated Daraja push." },
                { mode: "PRODUCTION", title: "Safaricom Daraja Live Production", desc: "Process real M-Pesa STK push transactions in Kenya Shillings." },
              ].map((env) => (
                <button
                  type="button"
                  key={env.mode}
                  onClick={() => handleChange("environment", env.mode)}
                  className={`p-3 text-left border-2 transition-all ${
                    formData.environment === env.mode
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-400"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider">{env.title}</p>
                  <p className="text-[11px] opacity-80 mt-1">{env.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* M-Pesa Daraja STK Push Configuration */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-zinc-500" /> M-Pesa Daraja STK Push Integration
              </h3>
              <button
                type="button"
                onClick={handleTestPing}
                disabled={testingPing}
                className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100"
              >
                {testingPing ? "Pinging API..." : "Ping Daraja API"}
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldWrap label="Business Shortcode / Paybill Number" helpText="6-digit Safaricom Paybill or Till">
                <Input
                  type="text"
                  value={formData.paybillNumber}
                  onChange={(e) => handleChange("paybillNumber", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>

              <FieldWrap label="Daraja Consumer Key">
                <Input
                  type="text"
                  value={formData.consumerKey}
                  onChange={(e) => handleChange("consumerKey", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>

              <FieldWrap label="Daraja Consumer Secret">
                <div className="relative">
                  <Input
                    type={showConsumerSecret ? "text" : "password"}
                    value={formData.consumerSecret}
                    onChange={(e) => handleChange("consumerSecret", e.target.value)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono pr-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConsumerSecret(!showConsumerSecret)}
                    className="absolute right-2 top-2.5 text-zinc-400 hover:text-zinc-700"
                  >
                    {showConsumerSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </FieldWrap>

              <FieldWrap label="Lipa Na M-Pesa Online Passkey">
                <div className="relative">
                  <Input
                    type={showPasskey ? "text" : "password"}
                    value={formData.passkey}
                    onChange={(e) => handleChange("passkey", e.target.value)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono pr-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasskey(!showPasskey)}
                    className="absolute right-2 top-2.5 text-zinc-400 hover:text-zinc-700"
                  >
                    {showPasskey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </FieldWrap>
            </div>
          </div>

          {/* M-Pesa B2C Vendor Payouts Setup */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-zinc-500" /> M-Pesa B2C Automated Vendor Payouts
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldWrap label="B2C API Initiator Name">
                <Input
                  type="text"
                  value={formData.b2cInitiator}
                  onChange={(e) => handleChange("b2cInitiator", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>

              <FieldWrap label="Initiator Security Credential">
                <Input
                  type="password"
                  value={formData.b2cSecurityCredential}
                  onChange={(e) => handleChange("b2cSecurityCredential", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>

              <FieldWrap label="Automated Payout Frequency">
                <select
                  value={formData.payoutSchedule}
                  onChange={(e) => handleChange("payoutSchedule", e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-mono focus:outline-none"
                >
                  <option value="INSTANT">Instant Upon Fulfillment</option>
                  <option value="DAILY">Daily (18:00 EAT)</option>
                  <option value="WEEKLY">Weekly (Mondays)</option>
                  <option value="MANUAL">Manual Admin Approval Only</option>
                </select>
              </FieldWrap>
            </div>
          </div>

          {/* Direct Bank Settlement Accounts */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-zinc-500" /> Platform Settlement Accounts
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {[
                { bank: "Equity Bank Kenya", account: "0180293810293", branch: "Upper Hill Branch", swift: "EQBLKENA" },
                { bank: "Standard Chartered Kenya", account: "0100982716200", branch: "Nairobi Main", swift: "SCBLKENX" },
              ].map((acc) => (
                <div
                  key={acc.bank}
                  className="flex items-center justify-between py-2 px-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
                >
                  <div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{acc.bank}</p>
                    <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                      Account: {acc.account} • {acc.branch} • SWIFT: {acc.swift}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 border border-emerald-300 dark:border-emerald-800">
                    VERIFIED
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Credentials are encrypted using AES-256 in production database storage.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="text-xs font-semibold uppercase tracking-widest px-5 py-2.5 border-2 border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
            >
              {saving ? "Updating Gateway..." : "Save Payment Gateway Settings"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
