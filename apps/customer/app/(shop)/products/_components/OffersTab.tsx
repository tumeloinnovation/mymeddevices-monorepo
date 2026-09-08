import React from 'react'
import { Tag, ShieldCheck, Gift, Percent, Truck } from 'lucide-react'
import type { Product } from '@/lib/data/types'

interface OffersTabProps {
  product?: Product
}

interface Offer {
  id: string
  icon: React.ElementType
  title: string
  description: string
  badge: string
  badgeColor: 'emerald' | 'blue' | 'red' | 'purple' | 'orange'
  applicable: boolean
}

export default function OffersTab({ product }: OffersTabProps) {
  // Generate offers based on product data
  const offers: Offer[] = React.useMemo(() => {
    const baseOffers: Offer[] = [
      {
        id: 'bundle-mobility',
        icon: Gift,
        title: 'Senior & Clinic Mobility Bundle',
        description: 'Buy 2 or more mobility devices and save 15% on your order total. Use promo code MOBILITY15',
        badge: 'Active Offer',
        badgeColor: 'emerald',
        applicable: true,
      },
      {
        id: 'free-shipping-nairobi',
        icon: Truck,
        title: 'Free Express Delivery in Nairobi',
        description: 'Complimentary express same-day courier dispatch on all local Nairobi healthcare orders over KSh 5,000',
        badge: 'Free Shipping',
        badgeColor: 'blue',
        applicable: true,
      },
      {
        id: 'first-order-discount',
        icon: Percent,
        title: 'First Order Discount - 10% OFF',
        description: 'New customer special! Get 10% off your first medical device order. Use promo code WELCOME10',
        badge: 'New Customer',
        badgeColor: 'purple',
        applicable: true,
      },
      {
        id: 'warranty-extension',
        icon: ShieldCheck,
        title: 'Extended Warranty Protection',
        description: 'Add 1 extra year of warranty coverage for just 5% of product price. Peace of mind for longer.',
        badge: 'Add-on',
        badgeColor: 'orange',
        applicable: true,
      },
    ]

    // Filter offers based on product characteristics
    return baseOffers.filter(offer => {
      // All offers are currently applicable to all products
      // You can add logic here to filter based on product categories, price, etc.
      return offer.applicable
    })
  }, [product])

  const getBadgeColors = (color: Offer['badgeColor']) => {
    const colors = {
      emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    }
    return colors[color]
  }

  const getIconBgColors = (color: Offer['badgeColor']) => {
    const colors = {
      emerald: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
      blue: 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
      red: 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400',
      purple: 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400',
    }
    return colors[color]
  }

  if (offers.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No special offers available for this product at the moment.</p>
        <p className="text-xs mt-1">Check back later or contact our sales team for custom quotes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-2">
      {offers.map((offer) => {
        const Icon = offer.icon
        return (
          <div
            key={offer.id}
            className="p-4 rounded-xl bg-gray-50 dark:bg-muted/20 border border-gray-200 dark:border-border flex items-start justify-between gap-4 transition-colors hover:bg-gray-100 dark:hover:bg-muted/30"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getIconBgColors(offer.badgeColor)} shrink-0 mt-0.5`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{offer.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {offer.description}
                </p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded border ${getBadgeColors(offer.badgeColor)} shrink-0`}>
              {offer.badge}
            </span>
          </div>
        )
      })}

      {/* Promo Code Input Section */}
      <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Have a promo code?</h4>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          Apply a promo code during checkout to redeem special discounts and offers.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter promo code"
            className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors">
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
