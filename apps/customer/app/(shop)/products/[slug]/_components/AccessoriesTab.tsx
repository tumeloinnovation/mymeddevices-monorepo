'use client'

import React, { useState, useMemo } from 'react'
import { ShoppingBag, ShoppingCart, Plus, Minus, Check, Sparkles, Shield, Package, ArrowRight, CheckCircle2 } from 'lucide-react'
import type { Product } from '@/lib/data/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ProductCard from '@/app/(shop)/products/_components/ProductCard'
import useCartStore from '@/lib/store/useCartStore'

interface AccessoriesTabProps {
  product: Product
  relatedProducts: Product[]
}

interface ConfigurableItem {
  id: string
  name: string
  price: number
  imageUrl?: string
  quantity: number
  isRequired: boolean
  isSelected: boolean
  relationType?: string
}

export default function AccessoriesTab({ product, relatedProducts }: AccessoriesTabProps) {
  const addToCart = useCartStore((state) => state.addItem)

  // Derive initial kit items from product bundle items or related accessories
  const initialItems: ConfigurableItem[] = useMemo(() => {
    const list: ConfigurableItem[] = [
      {
        id: String(product.id),
        name: product.name,
        price: typeof product.price === 'number' ? product.price : parseFloat(product.price || '0'),
        imageUrl: product.images?.[0]?.src,
        quantity: 1,
        isRequired: true,
        isSelected: true,
      }
    ]

    // If product has bundle items from backend
    if ((product as any).bundle_items && (product as any).bundle_items.length > 0) {
      (product as any).bundle_items.forEach((item: any) => {
        list.push({
          id: String(item.component_product?.id || item.id),
          name: item.component_product?.name || 'Component Item',
          price: item.component_product?.price || 0,
          imageUrl: item.component_product?.image_url,
          quantity: item.quantity || 1,
          isRequired: !item.is_optional,
          isSelected: true,
        })
      })
    } else {
      // Fallback to related products (accessories & spare parts)
      relatedProducts.forEach(rel => {
        list.push({
          id: String(rel.id),
          name: rel.name,
          price: typeof rel.price === 'number' ? rel.price : parseFloat(rel.price || '0'),
          imageUrl: rel.images?.[0]?.src,
          quantity: 1,
          isRequired: false,
          isSelected: true,
          relationType: (rel as any).relation_type || 'accessory'
        })
      })
    }

    return list
  }, [product, relatedProducts])

  const [items, setItems] = useState<ConfigurableItem[]>(initialItems)

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id && !item.isRequired) {
        return { ...item, isSelected: !item.isSelected }
      }
      return item
    }))
  }

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) }
      }
      return item
    }))
  }

  // Calculate pricing sums
  const totalIndividualSum = useMemo(() => {
    return items.reduce((acc, item) => item.isSelected ? acc + (item.price * item.quantity) : acc, 0)
  }, [items])

  const flatBundlePrice = typeof product.price === 'number' ? product.price : parseFloat(product.price || '0')
  const isBundleType = (product as any).product_type === 'bundle'
  const savings = isBundleType && totalIndividualSum > flatBundlePrice ? totalIndividualSum - flatBundlePrice : 0

  const handleAddBundleToCart = () => {
    // Add selected items to cart
    items.filter(i => i.isSelected).forEach(item => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.imageUrl || '',
        quantity: item.quantity
      } as any)
    })
  }

  return (
    <div className="space-y-8 py-4">
      {/* Kit & Bundle Header */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/30 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Custom Kit & Accessories Configurator
              </Badge>
              {savings > 0 && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-bold font-mono">
                  Save KES {savings.toLocaleString()}
                </Badge>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {isBundleType ? `Complete ${product.name} Package` : `Configure Accessories for ${product.name}`}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Select or customize included accessories, consumables, and replacement parts for a unified clinical setup.
            </p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-xl text-right space-y-3 shrink-0 w-full sm:w-auto">
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Kit Price</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                KES {(isBundleType ? flatBundlePrice : totalIndividualSum).toLocaleString()}
              </div>
              {savings > 0 && (
                <div className="text-[10px] text-slate-400 font-mono line-through">
                  Individual Sum: KES {totalIndividualSum.toLocaleString()}
                </div>
              )}
            </div>
            <Button
              onClick={handleAddBundleToCart}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-5 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Add Complete Kit to Cart
            </Button>
          </div>
        </div>
      </div>

      {/* Component Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" /> Kit Components & Compatible Add-ons ({items.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {items.filter(i => i.isSelected).length} items selected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                item.isSelected
                  ? 'border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <input
                  type="checkbox"
                  checked={item.isSelected}
                  disabled={item.isRequired}
                  onChange={() => toggleItem(item.id)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0 disabled:cursor-not-allowed"
                />

                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <Package className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                    {item.isRequired && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 uppercase font-mono">
                        Base Product
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    KES {item.price.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, -1)}
                    disabled={!item.isSelected || item.quantity <= 1}
                    className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs disabled:opacity-40"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, 1)}
                    disabled={!item.isSelected}
                    className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently Bought Together Grid */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Frequently Bought Together
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {relatedProducts.slice(0, 4).map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
