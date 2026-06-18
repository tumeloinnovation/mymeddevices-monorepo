import React from 'react'
import { formatCurrency } from '@/lib/utils/utils'

type Props = {
  price: number
  mrp?: number
}

export default function PriceTag({ price, mrp }: Props) {
  const formatted = (v: number) => `Ksh. ${formatCurrency(v)}`
  const discount = mrp ? Math.round((1 - price / mrp) * 100) : 0

  return (
    <div className="flex items-baseline flex-wrap gap-3">
      <div className="text-3xl sm:text-4xl font-extrabold text-foreground">{formatted(price)}</div>

      {mrp && discount > 0 && (
        <div className="flex items-baseline gap-3">
          <span className="text-sm line-through text-muted-foreground">{formatted(mrp)}</span>
          <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">{discount}% off</span>
        </div>
      )}
    </div>
  )
}
