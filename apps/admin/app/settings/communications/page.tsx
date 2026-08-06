"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Mail, MessageSquare, Send, CheckCircle2, AlertCircle, FileText } from "lucide-react"

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

export default function CommunicationsSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [sendingEmailTest, setSendingEmailTest] = useState(false)
  const [sendingSmsTest, setSendingSmsTest] = useState(false)

  const [testEmailTarget, setTestEmailTarget] = useState("admin@mymeddevices.co.ke")
  const [testSmsTarget, setTestSmsTarget] = useState("+254700123456")

  const [smtpData, setSmtpData] = useState({
    host: "smtp.sendgrid.net",
    port: 587,
    username: "apikey",
    password: "SG.live_key_88410293810239",
    fromEmail: "noreply@mymeddevices.co.ke",
    fromName: "MyMedDevices Medical Marketplace",
    useTls: true,
  })

  const [smsData, setSmsData] = useState({
    provider: "HOSTPINNACLE",
    apiKey: "hp_live_998102938471029",
    senderId: "MYMEDDEV",
    username: "mymeddevices_sms",
  })

  const handleSmtpChange = (key: string, val: any) => {
    setSmtpData((prev) => ({ ...prev, [key]: val }))
  }

  const handleSmsChange = (key: string, val: any) => {
    setSmsData((prev) => ({ ...prev, [key]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((res) => setTimeout(res, 500))
    setSaving(false)
    toast.success("Email and SMS gateway settings updated successfully")
  }

  const handleTestEmail = async () => {
    setSendingEmailTest(true)
    await new Promise((res) => setTimeout(res, 600))
    setSendingEmailTest(false)
    toast.success(`Test email dispatched to ${testEmailTarget}`)
  }

  const handleTestSms = async () => {
    setSendingSmsTest(true)
    await new Promise((res) => setTimeout(res, 600))
    setSendingSmsTest(false)
    toast.success(`Test SMS dispatched to ${testSmsTarget}`)
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl pb-12">
        <SettingsHeader
          title="Email & SMS Settings"
          description="SMTP mail server credentials, SMS gateway API setup, test dispatches, and transactional email templates"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SMTP Mail Server Setup */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-zinc-500" /> SMTP Transactional Mailer Server
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5">
                STATUS: READY
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldWrap label="SMTP Relay Host">
                <Input
                  type="text"
                  value={smtpData.host}
                  onChange={(e) => handleSmtpChange("host", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>

              <FieldWrap label="SMTP Port">
                <Input
                  type="number"
                  value={smtpData.port}
                  onChange={(e) => handleSmtpChange("port", parseInt(e.target.value) || 587)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>

              <FieldWrap label="SMTP Authentication Username">
                <Input
                  type="text"
                  value={smtpData.username}
                  onChange={(e) => handleSmtpChange("username", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>

              <FieldWrap label="SMTP Secret Password / API Key">
                <Input
                  type="password"
                  value={smtpData.password}
                  onChange={(e) => handleSmtpChange("password", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>

              <FieldWrap label="Sender From Email Address">
                <Input
                  type="email"
                  value={smtpData.fromEmail}
                  onChange={(e) => handleSmtpChange("fromEmail", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>

              <FieldWrap label="Sender Display Name">
                <Input
                  type="text"
                  value={smtpData.fromName}
                  onChange={(e) => handleSmtpChange("fromName", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs"
                  required
                />
              </FieldWrap>
            </div>
            <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useTls"
                  checked={smtpData.useTls}
                  onChange={(e) => handleSmtpChange("useTls", e.target.checked)}
                  className="size-3.5 accent-zinc-900 dark:accent-zinc-100"
                />
                <label htmlFor="useTls" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer">
                  Require STARTTLS / SSL Encryption
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  value={testEmailTarget}
                  onChange={(e) => setTestEmailTarget(e.target.value)}
                  className="rounded-none border-2 text-xs font-mono h-7 w-48"
                  placeholder="Target email"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={sendingEmailTest}
                  className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1 border border-zinc-800 dark:border-zinc-200 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 disabled:opacity-40"
                >
                  {sendingEmailTest ? "Sending..." : "Test Email"}
                </button>
              </div>
            </div>
          </div>

          {/* SMS Gateway Setup */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-zinc-500" /> SMS Gateway (Hostpinnacle / Africa's Talking)
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5">
                STATUS: READY
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldWrap label="SMS Provider Gateway">
                <select
                  value={smsData.provider}
                  onChange={(e) => handleSmsChange("provider", e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-mono focus:outline-none"
                >
                  <option value="HOSTPINNACLE">Hostpinnacle SMS Kenya</option>
                  <option value="AFRICASTALKING">Africa's Talking API</option>
                  <option value="TWILIO">Twilio Global SMS</option>
                </select>
              </FieldWrap>

              <FieldWrap label="Approved Sender ID">
                <Input
                  type="text"
                  value={smsData.senderId}
                  onChange={(e) => handleSmsChange("senderId", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono uppercase"
                  required
                />
              </FieldWrap>

              <FieldWrap label="API Key / Token">
                <Input
                  type="password"
                  value={smsData.apiKey}
                  onChange={(e) => handleSmsChange("apiKey", e.target.value)}
                  className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                  required
                />
              </FieldWrap>
            </div>
            <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-end gap-2">
              <Input
                type="text"
                value={testSmsTarget}
                onChange={(e) => setTestSmsTarget(e.target.value)}
                className="rounded-none border-2 text-xs font-mono h-7 w-40"
                placeholder="+254..."
              />
              <button
                type="button"
                onClick={handleTestSms}
                disabled={sendingSmsTest}
                className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1 border border-zinc-800 dark:border-zinc-200 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 disabled:opacity-40"
              >
                {sendingSmsTest ? "Sending..." : "Test SMS"}
              </button>
            </div>
          </div>

          {/* Compiled Transactional Email Templates Overview */}
          <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-zinc-500" /> Compiled MJML Email Templates
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">5 TEMPLATES ACTIVE</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { title: "Account Welcome & Verification", code: "account_welcome.html", status: "COMPILED" },
                  { title: "Order Receipt & Tax Invoice", code: "order_confirmation.html", status: "COMPILED" },
                  { title: "Shipment Dispatch & Tracking", code: "delivery_confirmation.html", status: "COMPILED" },
                  { title: "Vendor Verification Approved", code: "vendor_approved.html", status: "COMPILED" },
                  { title: "Password Reset Security Code", code: "password_reset.html", status: "COMPILED" },
                ].map((tmpl) => (
                  <div
                    key={tmpl.code}
                    className="p-2.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{tmpl.title}</p>
                      <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">{tmpl.code}</p>
                    </div>
                    <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 border border-emerald-300 dark:border-emerald-800">
                      {tmpl.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Dispatches use background asyncio task worker queue.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="text-xs font-semibold uppercase tracking-widest px-5 py-2.5 border-2 border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving Configurations..." : "Save Communications Settings"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
