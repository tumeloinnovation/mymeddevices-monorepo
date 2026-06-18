import React from 'react'
import { ShieldCheck, Truck, CreditCard, CheckCircle } from 'lucide-react'

export default function ProductTrustSignals() {
    return (
        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-lg p-5 mt-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Why Buy From MyMedDevices Kenya?</h3>

            {/* Regulatory Compliance */}
            <div className="flex items-start gap-3">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mt-0.5">
                    <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">PPB Regulations Compliant</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Verified medical device distributor approved by the Pharmacy and Poisons Board of Kenya.
                    </p>
                </div>
            </div>

            {/* Logistics */}
            <div className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mt-0.5">
                    <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">Counrty-wide Delivery</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Same-day delivery within Nairobi. Express shipping to Mombasa, Kisumu, Eldoret, and all 47 counties via trusted partners (G4S/Wells Fargo).
                    </p>
                </div>
            </div>

            {/* Payment */}
            <div className="flex items-start gap-3">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full mt-0.5">
                    <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">Secure Local Payments</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        We accept M-Pesa Business (Paybill/Till) and Bank Transfers. Secure and instant transaction verification.
                    </p>
                </div>
            </div>

            <div className="pt-2 mt-2 border-t border-blue-100 dark:border-blue-900/50 flex flex-wrap gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Official Warranty</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Installation Support</span>
            </div>
        </div>
    )
}
