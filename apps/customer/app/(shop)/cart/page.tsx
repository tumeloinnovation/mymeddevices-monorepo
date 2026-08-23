'use client'

import { useState, useEffect } from 'react'
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
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Package, TrendingUp, Tag, X, Loader2, Gift, Award } from 'lucide-react'
import { customerService } from '@/lib/services/customer-service'
import { customerCouponsApi } from '@/lib/api/endpoints/coupons'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useLoyaltyPoints } from '@/lib/hooks/useLoyalty'

export default function CartPage() {
  const { items, hydrated, getTotal, updateQuantity, removeItem, clear, cart } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const { points: loyaltyPoints, tier: loyaltyTier, isLoading: loyaltyLoading } = useLoyaltyPoints({ enabled: isAuthenticated })
  const [couponCode, setCouponCode] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [hasPrimaryAddress, setHasPrimaryAddress] = useState(false)

  useEffect(() => {
    async function checkAddress() {
      if (!isAuthenticated) {
        setHasPrimaryAddress(false)
        return
      }
      try {
        const addrs = await customerService.getAddresses()
        const hasPrimary = addrs.some((a: any) => a.isDefault || a.is_default)
        setHasPrimaryAddress(hasPrimary)
      } catch (err) {
        setHasPrimaryAddress(false)
      }
    }
    checkAddress()
  }, [isAuthenticated])

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
  const discountAmount = appliedCoupon?.discount_amount || 0
  const discountedSubtotal = Math.max(0, subtotal - discountAmount)
  const tax = discountedSubtotal * 0.16 // 16% VAT on discounted subtotal
  const total = Math.max(0, discountedSubtotal + (hasPrimaryAddress ? shipping : 0) + tax + PACKAGING_FEE + SERVICES_FEE)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setIsApplyingCoupon(true)
    try {
      const cartId = cart?.id || 'default-cart'
      const res = await customerCouponsApi.applyCoupon(cartId, couponCode)
      if (res && res.is_valid) {
        setAppliedCoupon(res)
      } else {
        setAppliedCoupon(null)
      }
    } catch (err) {
      setAppliedCoupon(null)
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = async () => {
    try {
      const cartId = cart?.id || 'default-cart'
      await customerCouponsApi.removeCoupon(cartId)
      setAppliedCoupon(null)
      setCouponCode('')
    } catch (err) {
      // toast error handled by API
    }
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
                  const itemId = item.id as string
                  const imageSrc = item?.images?.[0]?.url || (item?.images?.[0] as any)?.src || (item as any).image_url || '/logos/logo-portrait.png'
                  return (
                    <div key={itemId} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                        <Image
                          src={imageSrc}
                          alt={item.name || ''}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
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
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">{appliedCoupon.code}</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">(-Ksh {formatCurrency(appliedCoupon.discount_amount || 0)})</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="h-8 text-emerald-700 hover:text-emerald-800">
                    <X className="w-4 h-4 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button variant="outline" onClick={handleApplyCoupon} disabled={isApplyingCoupon || !couponCode.trim()}>
                    {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
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
              {hasPrimaryAddress && (
                <>
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
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Packaging Fee</span>
                <span className="font-medium">Ksh {formatCurrency(PACKAGING_FEE)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Services Fee</span>
                <span className="font-medium">Ksh {formatCurrency(SERVICES_FEE)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (16%)</span>
                <span className="font-medium">Ksh {formatCurrency(tax)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Discount ({appliedCoupon.code})
                  </span>
                  <span>- Ksh {formatCurrency(discountAmount)}</span>
                </div>
              )}

              {/* Loyalty Points Preview */}
              {isAuthenticated && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-100">Your Rewards</span>
                    </div>
                    <Link
                      href="/dashboard/loyalty"
                      className="text-xs text-amber-700 dark:text-amber-300 hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {loyaltyLoading ? (
                        <Skeleton className="h-5 w-16 rounded bg-amber-200/50" />
                      ) : (
                        <>
                          <span className="text-lg font-bold text-amber-900 dark:text-amber-100">
                            {loyaltyPoints.toLocaleString()}
                          </span>
                          <span className="text-xs text-amber-700 dark:text-amber-300">pts</span>
                        </>
                      )}
                    </div>
                    {!loyaltyLoading && loyaltyPoints > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          = Ksh {formatCurrency(Math.floor(loyaltyPoints / 2))} discount
                        </p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400">
                          Redeem at checkout
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
