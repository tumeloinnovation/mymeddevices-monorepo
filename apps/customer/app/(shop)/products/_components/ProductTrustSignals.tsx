import { Truck, ShieldCheck, Award, HeadphonesIcon } from 'lucide-react'

export default function ProductTrustSignals() {
  const signals = [
    {
      icon: Truck,
      title: 'Free Delivery',
      description: 'Free shipping on orders over KES 50,000',
      color: 'bg-blue-50 dark:bg-blue-950/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: ShieldCheck,
      title: '2-Year Warranty',
      description: 'Comprehensive warranty coverage included',
      color: 'bg-green-50 dark:bg-green-950/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      icon: Award,
      title: 'Certified Authentic',
      description: '100% genuine medical equipment',
      color: 'bg-purple-50 dark:bg-purple-950/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: HeadphonesIcon,
      title: '24/7 Support',
      description: 'Expert support available anytime',
      color: 'bg-amber-50 dark:bg-amber-950/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {signals.map((signal) => {
        const Icon = signal.icon
        return (
          <div
            key={signal.title}
            className={`${signal.color} border border-gray-200 dark:border-border rounded-lg p-4 flex flex-col items-center text-center`}
          >
            <div className={`${signal.iconColor} mb-2`}>
              <Icon className="h-6 w-6" strokeWidth={2} />
            </div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
              {signal.title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {signal.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}
