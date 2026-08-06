import React from 'react'
import { Tag, ShieldCheck, Gift } from 'lucide-react'

export default function OffersTab() {
  return (
    <div className="space-y-4 p-2">
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted/20 border border-gray-200 dark:border-border flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Senior & Clinic Mobility Bundle</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Buy 2 or more mobility devices and save 15% on your order total. Use promo code <code className="bg-gray-200 dark:bg-muted px-1.5 py-0.5 rounded font-mono text-emerald-600 dark:text-emerald-400 font-bold">MOBILITY15</code>
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">Active Offer</span>
      </div>

      <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted/20 border border-gray-200 dark:border-border flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Free Express Delivery in Nairobi</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Complimentary express same-day courier dispatch on all local Nairobi healthcare orders over KSh 5,000.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">Free Shipping</span>
      </div>
    </div>
  )
}
