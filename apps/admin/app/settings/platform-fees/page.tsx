"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import DashboardLayout from "@/components/dashboard-layout"
import { SettingsHeader } from "@/components/settings-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { DollarSign, Percent, ShieldCheck, RefreshCw } from "lucide-react"
import { systemService, type PlatformFees } from "@mymeddevices/shared-core"

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

export default function PlatformFeesSettingsPage() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<PlatformFees>({
    base_commission_percent: 10.0,
    flat_transaction_fee: 50.0,
    tax_vat_percent: 16.0,
    minimum_payout_amount: 1000.0,
    payout_schedule: "weekly",
    withdrawal_fee: 50.0,
  })

  const { data: remoteFees, isLoading } = useQuery<PlatformFees>({
    queryKey: ["system", "platform-fees"],
    queryFn: () => systemService.getPlatformFees(),
  })

  useEffect(() => {
    if (remoteFees) {
      setFormData((prev) => ({ ...prev, ...remoteFees }))
    }
  }, [remoteFees])

  const mutation = useMutation({
    mutationFn: (updated: Partial<PlatformFees>) => systemService.updatePlatformFees(updated),
    onSuccess: (savedData) => {
      queryClient.setQueryData(["system", "platform-fees"], savedData)
      toast.success("Platform commission & fee configuration updated")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save fee settings")
    },
  })

  const handleChange = (key: keyof PlatformFees, value: any) => {
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
          title="Platform Fees & Commissions"
          description="Manage vendor commissions, payout thresholds, statutory deductions, and payment processing fees"
        />

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading platform fees...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Commissions */}
            <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <Percent className="h-3.5 w-3.5 text-zinc-500" /> Marketplace Take Rates
                </h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWrap label="Base Vendor Commission Rate (%)" helpText="Applied across general medical supplies">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.base_commission_percent}
                    onChange={(e) => handleChange("base_commission_percent", parseFloat(e.target.value) || 0)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    required
                  />
                </FieldWrap>

                <FieldWrap label="Flat Processing Fee (KES)" helpText="Per-order checkout gateway handling charge">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.flat_transaction_fee}
                    onChange={(e) => handleChange("flat_transaction_fee", parseFloat(e.target.value) || 0)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    required
                  />
                </FieldWrap>
              </div>
            </div>

            {/* Vendor Payout Constraints */}
            <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="px-4 py-2.5 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-zinc-500" /> Seller Settlement Constraints
                </h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <FieldWrap label="Minimum Payout Threshold (KES)" helpText="Minimum escrow balance before disbursement">
                  <Input
                    type="number"
                    step="100"
                    min="100"
                    value={formData.minimum_payout_amount}
                    onChange={(e) => handleChange("minimum_payout_amount", parseFloat(e.target.value) || 0)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    required
                  />
                </FieldWrap>

                <FieldWrap label="Withdrawal Handling Surcharge (KES)" helpText="B2B M-Pesa or Bank transfer cost">
                  <Input
                    type="number"
                    step="5"
                    min="0"
                    value={formData.withdrawal_fee || 50}
                    onChange={(e) => handleChange("withdrawal_fee", parseFloat(e.target.value) || 0)}
                    className="rounded-none border-2 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:ring-0 text-xs font-mono"
                    required
                  />
                </FieldWrap>

                <FieldWrap label="Disbursement Frequency" helpText="Automatic vendor settlement batch cycle">
                  <select
                    value={formData.payout_schedule || "weekly"}
                    onChange={(e) => handleChange("payout_schedule", e.target.value)}
                    className="w-full h-9 rounded-none border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-mono focus:outline-none"
                  >
                    <option value="daily">Daily Settlement</option>
                    <option value="weekly">Weekly (Every Monday)</option>
                    <option value="biweekly">Bi-weekly (1st & 15th)</option>
                    <option value="monthly">Monthly (End of month)</option>
                  </select>
                </FieldWrap>
              </div>
            </div>

            {/* Statutory Compliance Notice */}
            <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-900 dark:text-white">KRA Withholding VAT Compliance</p>
                <p>All disbursements comply with Kenyan statutory 2% Withholding VAT rules. Invoices and tax receipts are automatically formatted for electronic tax invoice register (TIMS/eTIMS) compliance.</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Changes take effect for all subsequent order calculations.
              </span>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="text-xs font-semibold uppercase tracking-widest px-5 py-2.5 border-2 border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
              >
                {mutation.isPending ? "Saving..." : "Save Platform Fee Rules"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
