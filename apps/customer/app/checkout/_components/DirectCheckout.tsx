import React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

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
    <div className={`w-full ${className}`}>
      <Link href="/checkout" onClick={handleCheckout} className="w-full block">
        <Button 
          size="lg" 
          variant="secondary"
          className="w-full h-14 text-lg font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          Proceed to Checkout
        </Button>
      </Link>
    </div>
  )
}
