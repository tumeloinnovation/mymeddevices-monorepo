'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShoppingCart,
  Check,
  Layers,
  Plus,
  Minus,
  Package,
  Zap,
  CheckCircle2,
  Truck,
  ShieldCheck,
  ArrowRight,
  Trash2,
} from 'lucide-react'
import type { Product } from '@/lib/data/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useCartStore from '@/lib/store/useCartStore'
import { formatCurrency } from '@/lib/utils/utils'
import { toast } from 'sonner'

interface BundleConfiguratorProps {
  product: Product
  relatedProducts: Product[]
  quantity: number
  setQuantity: (q: number) => void
  onAddOnsChange?: (total: number) => void
}

interface BundleOptionItem {
  id: string
  name: string
  slug?: string
  price: number
  imageUrl?: string
  quantity: number
  isRequired: boolean
  isSelected: boolean
}

export default function BundleConfigurator({
  product,
  relatedProducts,
  quantity,
  setQuantity,
  onAddOnsChange,
}: BundleConfiguratorProps) {
  const router = useRouter()
  const addToCartStore = useCartStore((state) => state.addItem)
  const updateQuantityStore = useCartStore((state) => state.updateQuantity)
  const removeFromCartStore = useCartStore((state) => state.removeItem)
  const isInCart = useCartStore((state) => state.isInCart(product.id))
  const cartQuantity = useCartStore((state) => state.getItemQuantity(product.id))

  const [added, setAdded] = useState(false)

  // Primary product image
  const primaryImage =
    product.images?.[0]?.src ||
    (product as any).imageUrl ||
    (product as any).image_url ||
    ''

  const [options, setOptions] = useState<BundleOptionItem[]>(() => {
    const list: BundleOptionItem[] = []

    // Populate from backend bundle_items
    if (product.bundle_items && product.bundle_items.length > 0) {
      product.bundle_items.forEach((item) => {
        const isOpt = Boolean(item.is_optional)
        if (isOpt) {
          list.push({
            id: String(item.component_product?.id || item.id),
            name: item.component_product?.name || 'Component Option',
            slug: item.component_product?.slug,
            price: item.component_product?.price || 0,
            imageUrl:
              item.component_product?.image_url ||
              (item.component_product as any)?.images?.[0]?.src,
            quantity: item.quantity || 1,
            isRequired: false,
            isSelected: false,
          })
        }
      })
    }

    // Surface related products as available add-on options for bundle products
    if (product.product_type === 'bundle' && relatedProducts && relatedProducts.length > 0) {
      relatedProducts.forEach((rel) => {
        const alreadyAdded = list.some((l) => l.id === String(rel.id))
        if (!alreadyAdded) {
          list.push({
            id: String(rel.id),
            name: rel.name,
            slug: rel.slug,
            price: typeof rel.price === 'number' ? rel.price : parseFloat(rel.price || '0'),
            imageUrl: rel.images?.[0]?.src || (rel as any).imageUrl,
            quantity: 1,
            isRequired: false,
            isSelected: false,
          })
        }
      })
    }

    return list
  })

  const isBundle =
    product.product_type === 'bundle' ||
    (Boolean(product.bundle_items) && (product.bundle_items?.length ?? 0) > 0)

  // Sync quantity with cart store when cart status changes
  useEffect(() => {
    if (isInCart && cartQuantity > 0) {
      setQuantity(cartQuantity)
    }
  }, [isInCart, cartQuantity, setQuantity])

  // Sync selected add-ons price with parent
  useEffect(() => {
    const optTotal = options
      .filter((i) => i.isSelected)
      .reduce((acc, i) => acc + i.price * i.quantity, 0)
    onAddOnsChange?.(optTotal)
  }, [options, onAddOnsChange])

  if (!isBundle) return null

  const toggleOption = (id: string) => {
    setOptions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextSelected = !item.isSelected
          // If the kit is already in cart, dynamically add/remove the add-on from cart
          if (isInCart) {
            if (nextSelected) {
              addToCartStore(
                {
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  image: item.imageUrl || '',
                } as any,
                (item.quantity || 1) * quantity
              )
              toast.success(`Added ${item.name} to your cart`)
            } else {
              removeFromCartStore(item.id)
              toast.info(`Removed ${item.name} from your cart`)
            }
          }
          return { ...item, isSelected: nextSelected }
        }
        return item
      })
    )
  }

  const mainProductPrice = useMemo(
    () => (typeof product.price === 'number' ? product.price : parseFloat(product.price || '0')),
    [product.price]
  )

  const { optionalsTotal, grandTotal, selectedCount } = useMemo(() => {
    const optTotal = options
      .filter((i) => i.isSelected)
      .reduce((acc, i) => acc + i.price * i.quantity, 0)
    const grand = (mainProductPrice + optTotal) * quantity
    const count = options.filter((i) => i.isSelected).length
    return { optionalsTotal: optTotal, grandTotal: grand, selectedCount: count }
  }, [options, mainProductPrice, quantity])

  const handleQuantityUpdate = (newQty: number) => {
    if (isInCart) {
      if (newQty <= 0) {
        removeFromCartStore(product.id)
        options.forEach((item) => removeFromCartStore(item.id))
        setQuantity(1)
        toast.info('Kit removed from cart')
      } else {
        setQuantity(newQty)
        updateQuantityStore(product.id, newQty)
        options
          .filter((i) => i.isSelected)
          .forEach((item) => {
            updateQuantityStore(item.id, (item.quantity || 1) * newQty)
          })
      }
    } else {
      setQuantity(Math.max(1, newQty))
    }
  }

  const handleAddBundleToCart = () => {
    // 1. Add the main bundle / base product
    addToCartStore(
      {
        id: product.id,
        name: product.name,
        price: mainProductPrice,
        image: primaryImage,
      } as any,
      quantity
    )

    // 2. Add each selected optional add-on individually scaled by quantity
    options
      .filter((i) => i.isSelected)
      .forEach((item) => {
        addToCartStore(
          {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.imageUrl || '',
          } as any,
          (item.quantity || 1) * quantity
        )
      })

    setAdded(true)
    toast.success(`Added ${product.name} kit${selectedCount > 0 ? ` with ${selectedCount} add-on${selectedCount > 1 ? 's' : ''}` : ''} to cart!`)
    setTimeout(() => setAdded(false), 2500)
  }

  const handleBuyNow = () => {
    if (!isInCart) {
      handleAddBundleToCart()
    }
    router.push('/checkout')
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card text-card-foreground p-4 sm:p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Kit & Optional Add-ons
          </h3>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
          IN STOCK
        </Badge>
      </div>

      {/* Optional Add-ons Checklist */}
      {options.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Select Add-ons
            </span>
            {selectedCount > 0 && (
              <span className="text-xs font-semibold text-primary font-mono">
                +{selectedCount} added (+KES {formatCurrency(optionalsTotal)})
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {options.map((option) => (
              <div
                key={option.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleOption(option.id)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    toggleOption(option.id)
                  }
                }}
                className={`group flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                  option.isSelected
                    ? 'border-primary/60 bg-primary/[0.04] dark:bg-primary/[0.08] shadow-2xs'
                    : 'border-border/70 bg-card hover:bg-muted/30 hover:border-border'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Custom Checkbox */}
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                      option.isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/40 bg-background group-hover:border-primary'
                    }`}
                  >
                    {option.isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-11 h-11 rounded-lg bg-background border border-border/60 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    {option.imageUrl ? (
                      <img src={option.imageUrl} alt={option.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                    ) : (
                      <Layers className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Title and Price Stacked */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {option.name}
                    </span>
                    <span className="text-xs font-bold text-primary font-mono tabular-nums mt-0.5">
                      {option.price > 0 ? `+KES ${formatCurrency(option.price)}` : 'Free'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Stepper */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
        <span className="font-semibold text-foreground">
          {isInCart ? 'Quantity in Cart' : 'Quantity'}
        </span>
        <div className="flex items-center border border-border bg-background rounded-xl overflow-hidden h-9 shadow-2xs">
          <button
            type="button"
            onClick={() => handleQuantityUpdate(quantity - 1)}
            disabled={!isInCart && quantity <= 1}
            className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Decrease bundle quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div className="px-2.5 font-bold text-foreground text-xs font-mono min-w-[28px] text-center select-none">
            {quantity}
          </div>
          <button
            type="button"
            onClick={() => handleQuantityUpdate(quantity + 1)}
            className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Increase bundle quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selected Items Breakdown */}
      {(selectedCount > 0 || quantity > 1) && (
        <div className="p-2.5 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/60 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Total {isInCart ? 'in Cart' : 'Kit Price'}:
          </span>
          <span className="font-bold text-primary font-mono text-sm">
            KES {formatCurrency(grandTotal)}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5">
        {isInCart && cartQuantity > 0 ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              {/* View Cart & Checkout */}
              <Button
                asChild
                className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Link href="/cart">
                  <ShoppingCart className="w-4 h-4" />
                  <span>View Cart & Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              {/* Remove Kit from Cart */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  removeFromCartStore(product.id)
                  options.forEach((item) => removeFromCartStore(item.id))
                  setQuantity(1)
                  toast.info('Kit removed from cart')
                }}
                className="h-11 w-11 shrink-0 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-border cursor-pointer"
                title="Remove Kit from Cart"
                aria-label="Remove Kit from Cart"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* In Cart Status Indicator */}
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Item is in your cart ({quantity} {quantity === 1 ? 'unit' : 'units'})
              </span>
              <Link href="/checkout" className="text-primary hover:underline font-medium inline-flex items-center gap-0.5">
                Direct Checkout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <Button
              type="button"
              onClick={handleAddBundleToCart}
              className={`w-full h-11 font-semibold rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                added
                  ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              {added ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    {selectedCount > 0
                      ? `Add Kit to Cart — KES ${formatCurrency(grandTotal)}`
                      : `Add to Cart — KES ${formatCurrency(grandTotal)}`}
                  </span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleBuyNow}
              className="w-full h-10 border-primary/30 text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>Buy Now with Instant Checkout</span>
            </Button>
          </>
        )}
      </div>

      {/* Quick Trust Highlights */}
      <div className="pt-2 border-t border-border/60 flex flex-col gap-1.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>Fast Delivery Across Kenya</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>PPB Approved & Genuine Device</span>
        </div>
      </div>
    </div>
  )
}
