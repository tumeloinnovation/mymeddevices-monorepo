import React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type Props = {
  productName: string
  price: number
  quantity?: number
  className?: string
  onAddToCart?: () => void
}

export default function DirectCheckout({ className = '', onAddToCart }: Props) {
  const handleCheckout = () => {
    if (onAddToCart) {
      onAddToCart();
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <Link href="/checkout" onClick={handleCheckout} className="w-full">
        <Button size="lg" className="w-full px-6 py-3">Proceed to Checkout</Button>
      </Link>
    </div>
  )
}
