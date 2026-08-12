'use client'

import React, { useState, useMemo } from 'react'
import { ShoppingCart, Plus, Minus, Package, Check } from 'lucide-react'
import type { Product } from '@/lib/data/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useCartStore from '@/lib/store/useCartStore'

interface BundleConfiguratorProps {
  product: Product
  relatedProducts: Product[]
}

interface BundleItem {
  id: string
  name: string
  price: number
  imageUrl?: string
  quantity: number
  isRequired: boolean
  isSelected: boolean
}

export default function BundleConfigurator({ product, relatedProducts }: BundleConfiguratorProps) {
  const addToCart = useCartStore((state) => state.addItem)
  const [items, setItems] = useState<BundleItem[]>(() => {
    const list: BundleItem[] = []

    // If product has bundle items from backend
    if (product.bundle_items && product.bundle_items.length > 0) {
      product.bundle_items.forEach((item) => {
        list.push({
          id: String(item.component_product?.id || item.id),
          name: item.component_product?.name || 'Component Item',
          price: item.component_product?.price || 0,
          imageUrl: item.component_product?.image_url,
          quantity: item.quantity || 1,
          isRequired: !item.is_optional,
          isSelected: !item.is_optional, // Auto-select required items
        })
      })
    }

    // Only add related products if we have a bundle product type
    if (product.product_type === 'bundle' && relatedProducts.length > 0) {
      relatedProducts.forEach(rel => {
        list.push({
          id: String(rel.id),
          name: rel.name,
          price: typeof rel.price === 'number' ? rel.price : parseFloat(rel.price || '0'),
          imageUrl: rel.images?.[0]?.src,
          quantity: 1,
          isRequired: false,
          isSelected: false,
        })
      })
    }

    return list
  })

  const hasBundle = items.length > 0

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id && !item.isRequired) {
        return { ...item, isSelected: !item.isSelected }
      }
      return item
    }))
  }

  // Calculate pricing
  const { accessoriesTotal, totalCount } = useMemo(() => {
    const total = items.reduce((acc, item) => item.isSelected ? acc + (item.price * item.quantity) : acc, 0)
    const count = items.filter(i => i.isSelected).length

    return {
      accessoriesTotal: total,
      totalCount: count
    }
  }, [items])

  const handleAddBundleToCart = () => {
    // First add the main product (always included)
    const mainProductPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price || '0')
    addToCart({
      id: product.id,
      name: product.name,
      price: mainProductPrice,
      image: product.images?.[0]?.src || '',
      quantity: 1
    } as any)

    // Then add selected bundle items
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

  // Don't show anything if no bundle items
  if (!hasBundle) return null

  const mainProductPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price || '0')

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Bundle & Accessories
          </h3>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalCount} selected
            </Badge>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 font-mono">
            + KES {accessoriesTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => !item.isRequired && toggleItem(item.id)}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
              item.isSelected
                ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800'
                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            } ${item.isRequired ? 'cursor-default opacity-70' : ''}`}
          >
            {/* Checkbox */}
            <div className="relative">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                item.isSelected
                  ? 'bg-emerald-600 border-emerald-600'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              }`}>
                {item.isSelected && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
            </div>

            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
              ) : (
                <Package className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {item.name}
              </p>
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                KES {item.price.toLocaleString()}
              </p>
            </div>

            {/* Status Badge */}
            {item.isRequired ? (
              <Badge variant="secondary" className="text-[10px] shrink-0">
                Included
              </Badge>
            ) : item.isSelected ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium shrink-0">Added</span>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Click to add</span>
            )}
          </div>
        ))}
      </div>

      {/* Summary & Add Button */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-gray-600 dark:text-gray-400">
            Total with accessories:
          </span>
          <span className="font-bold text-gray-900 dark:text-gray-100 font-mono">
            KES {(mainProductPrice + accessoriesTotal).toLocaleString()}
          </span>
        </div>
        <Button
          onClick={handleAddBundleToCart}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          size="default"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add {product.name} {totalCount > 0 && `+ ${totalCount} accessory${totalCount > 1 ? 's' : ''}`} to Cart
        </Button>
      </div>
    </div>
  )
}
