'use client'

import React, { useState, useMemo } from 'react'
import { ShoppingCart, Package, Check, ExternalLink, Info } from 'lucide-react'
import type { Product } from '@/lib/data/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useCartStore from '@/lib/store/useCartStore'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/utils'

interface BundleConfiguratorProps {
  product: Product
  relatedProducts: Product[]
}

interface BundleItem {
  id: string
  name: string
  slug?: string
  price: number
  imageUrl?: string
  quantity: number
  isRequired: boolean
  isSelected: boolean
}

export default function BundleConfigurator({ product, relatedProducts }: BundleConfiguratorProps) {
  const addToCart = useCartStore((state) => state.addItem)
  const [added, setAdded] = useState(false)
  const [bundleQty, setBundleQty] = useState(1)

  const [items, setItems] = useState<BundleItem[]>(() => {
    const list: BundleItem[] = []

    // Populate from backend bundle_items
    if (product.bundle_items && product.bundle_items.length > 0) {
      product.bundle_items.forEach((item) => {
        list.push({
          id: String(item.component_product?.id || item.id),
          name: item.component_product?.name || 'Component Item',
          slug: item.component_product?.slug,
          price: item.component_product?.price || 0,
          imageUrl: item.component_product?.image_url,
          quantity: item.quantity || 1,
          isRequired: !item.is_optional,
          isSelected: true, // all items default selected (required auto-selected; optional can be unchecked)
        })
      })
    }

    // Optional: also surface related products as add-ons only if this is a bundle
    if (product.product_type === 'bundle' && relatedProducts.length > 0) {
      relatedProducts.forEach((rel) => {
        // Don't duplicate items already in bundle_items
        const alreadyAdded = list.some((l) => l.id === String(rel.id))
        if (!alreadyAdded) {
          list.push({
            id: String(rel.id),
            name: rel.name,
            slug: rel.slug,
            price: typeof rel.price === 'number' ? rel.price : parseFloat(rel.price || '0'),
            imageUrl: rel.images?.[0]?.src,
            quantity: 1,
            isRequired: false,
            isSelected: false,
          })
        }
      })
    }

    return list
  })

  const hasBundle = items.length > 0
  const hasOptional = items.some((i) => !i.isRequired)

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id && !item.isRequired) {
          return { ...item, isSelected: !item.isSelected }
        }
        return item
      })
    )
  }

  const mainProductPrice = useMemo(
    () => (typeof product.price === 'number' ? product.price : parseFloat(product.price || '0')),
    [product.price]
  )

  const { optionalsTotal, grandTotal, selectedOptionalCount } = useMemo(() => {
    const optTotal = items
      .filter((i) => !i.isRequired && i.isSelected)
      .reduce((acc, i) => acc + i.price * i.quantity, 0)
    const grand = (mainProductPrice + optTotal) * bundleQty
    const count = items.filter((i) => !i.isRequired && i.isSelected).length
    return { optionalsTotal: optTotal, grandTotal: grand, selectedOptionalCount: count }
  }, [items, mainProductPrice, bundleQty])

  const requiredItems = items.filter((i) => i.isRequired)
  const optionalItems = items.filter((i) => !i.isRequired)

  const handleAddBundleToCart = () => {
    // Add the main bundle product
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: mainProductPrice,
        image: product.images?.[0]?.src || '',
        quantity: bundleQty,
      } as any
    )

    // Add each selected optional item individually
    items
      .filter((i) => !i.isRequired && i.isSelected)
      .forEach((item) => {
        addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.imageUrl || '',
          quantity: item.quantity,
        } as any)
      })

    setAdded(true)
    setTimeout(() => setAdded(false), 3000)
  }

  if (!hasBundle) return null

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-900/50 bg-amber-100/60 dark:bg-amber-900/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          <span className="font-semibold text-sm text-amber-900 dark:text-amber-200">
            What&apos;s in this Bundle
          </span>
        </div>
        <Badge className="bg-amber-600 text-white text-[10px] px-2 py-0.5 border-0">
          {requiredItems.length} item{requiredItems.length !== 1 ? 's' : ''} included
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Required / Included Items */}
        {requiredItems.length > 0 && (
          <div className="space-y-2">
            {hasOptional && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Always Included
              </p>
            )}
            <div className="space-y-2">
              {requiredItems.map((item) => (
                <BundleItemRow key={item.id} item={item} onToggle={toggleItem} />
              ))}
            </div>
          </div>
        )}

        {/* Optional Add-ons */}
        {optionalItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Optional Add-ons
              </p>
              <Info className="w-3 h-3 text-gray-400" />
            </div>
            <div className="space-y-2">
              {optionalItems.map((item) => (
                <BundleItemRow key={item.id} item={item} onToggle={toggleItem} />
              ))}
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        <div className="pt-3 border-t border-amber-200 dark:border-amber-800 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Bundle base price</span>
            <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">
              KES {formatCurrency(mainProductPrice)}
            </span>
          </div>

          {optionalsTotal > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Add-ons ({selectedOptionalCount})
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                + KES {formatCurrency(optionalsTotal)}
              </span>
            </div>
          )}

          {bundleQty > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Quantity</span>
              <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                × {bundleQty}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1.5 border-t border-amber-200/70 dark:border-amber-800/50">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400 tabular-nums">
              KES {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* Quantity + CTA row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setBundleQty((q) => Math.max(1, q - 1))}
              className="px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <div className="px-4 py-2.5 font-semibold text-gray-900 dark:text-gray-100 min-w-[40px] text-center text-sm">
              {bundleQty}
            </div>
            <button
              type="button"
              onClick={() => setBundleQty((q) => q + 1)}
              className="px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <Button
            onClick={handleAddBundleToCart}
            className={`flex-1 font-semibold transition-all duration-200 ${
              added
                ? 'bg-green-600 hover:bg-green-600 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
            size="default"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {added
              ? 'Added to Cart!'
              : selectedOptionalCount > 0
              ? `Add Bundle + ${selectedOptionalCount} Add-on${selectedOptionalCount > 1 ? 's' : ''} to Cart`
              : 'Add Bundle to Cart'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-component ────────────────────────────────────────────────────────────

interface BundleItemRowProps {
  item: BundleItem
  onToggle: (id: string) => void
}

function BundleItemRow({ item, onToggle }: BundleItemRowProps) {
  return (
    <div
      onClick={() => !item.isRequired && onToggle(item.id)}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        item.isRequired
          ? 'border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-900/50 cursor-default'
          : item.isSelected
          ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 cursor-pointer'
          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer'
      }`}
    >
      {/* Checkbox (only for optional items) */}
      {!item.isRequired && (
        <div
          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
            item.isSelected
              ? 'bg-emerald-600 border-emerald-600'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }`}
        >
          {item.isSelected && <Check className="w-2.5 h-2.5 text-white" />}
        </div>
      )}

      {/* Included checkmark (for required items) */}
      {item.isRequired && (
        <div className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 flex items-center justify-center shrink-0">
          <Check className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />
        </div>
      )}

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-1" />
        ) : (
          <Package className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-tight">
            {item.name}
          </p>
          {item.slug && (
            <Link
              href={`/products/${item.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
              title="View product"
            >
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {item.price > 0 ? `KES ${formatCurrency(item.price)}` : 'Included'}
            {item.quantity > 1 && ` × ${item.quantity}`}
          </p>
        </div>
      </div>

      {/* Status label */}
      <div className="shrink-0">
        {item.isRequired ? (
          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
            Included
          </span>
        ) : item.isSelected ? (
          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
            Added
          </span>
        ) : (
          <span className="text-[10px] text-gray-400">+ Add</span>
        )}
      </div>
    </div>
  )
}
