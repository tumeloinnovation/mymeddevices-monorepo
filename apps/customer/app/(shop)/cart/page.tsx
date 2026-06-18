'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import useCartStore from '@/lib/store/useCartStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency } from '@/lib/utils/utils'
import { PACKAGING_FEE, SERVICES_FEE } from '@/lib/config/fees'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Package, TrendingUp } from 'lucide-react'

export default function CartPage() {
  const { items, hydrated, getTotal, updateQuantity, removeItem, clear } = useCartStore()
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)

  if (!hydrated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Browse our products and find what you need."
          actionLabel="Start Shopping"
          actionHref="/products"
        />
      </div>
    )
  }

  const subtotal = getTotal()
  const shipping = subtotal >= 50000 ? 0 : 500
  const total = subtotal + shipping + PACKAGING_FEE + SERVICES_FEE

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return
    setCouponApplied(true)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
          <p className="text-muted-foreground mt-1">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cart Items</CardTitle>
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clear}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {items.map((item) => {
                  const itemTotal = Number(item.price) * item.quantity
                  const itemId = item.id as number
                  return (
                    <div key={itemId} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                        {item.images?.[0]?.src ? (
                          <Image
                            src={item.images[0].src}
                            alt={item.name || ''}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.slug || itemId}`}>
                          <h4 className="font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
                            {item.name}
                          </h4>
                        </Link>
                        {item.sku && (
                          <p className="text-xs text-muted-foreground mt-1">SKU: {item.sku}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          Ksh {formatCurrency(Number(item.price))} each
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(itemId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(itemId, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <p className="font-semibold text-foreground">
                          Ksh {formatCurrency(itemTotal)}
                        </p>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-red-600 shrink-0"
                        onClick={() => removeItem(itemId)}
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Coupon */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coupon Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="max-w-xs"
                />
                <Button variant="outline" onClick={handleApplyCoupon} disabled={!couponCode.trim()}>
                  Apply
                </Button>
              </div>
              {couponApplied && (
                <p className="text-sm text-muted-foreground mt-2">
                  Coupon functionality is available during checkout.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">You Might Also Like</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Recommendations will appear here based on your cart items.
                Complete your purchase to get personalized suggestions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">Ksh {formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? 'Free' : `Ksh ${formatCurrency(shipping)}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground -mt-2">
                  Free shipping on orders over Ksh 50,000
                </p>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Packaging Fee</span>
                <span className="font-medium">Ksh {formatCurrency(PACKAGING_FEE)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Services Fee</span>
                <span className="font-medium">Ksh {formatCurrency(SERVICES_FEE)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="text-primary">Ksh {formatCurrency(total)}</span>
              </div>

              <Button className="w-full mt-4 gap-2" size="lg" asChild>
                <Link href="/checkout">
                  <ShoppingBag className="h-4 w-4" />
                  Proceed to Checkout
                </Link>
              </Button>

              <div className="text-center">
                <Link href="/products">
                  <Button variant="link" className="text-muted-foreground">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
