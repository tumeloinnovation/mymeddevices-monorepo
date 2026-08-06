'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2, ShoppingCart, Eye } from 'lucide-react'
import { useRecentlyViewedStore } from '@/lib/store/useRecentlyViewedStore'
import ProductCard from '@/app/(shop)/products/_components/ProductCard'

export default function RecentlyViewedPage() {
  const { items, clearItems } = useRecentlyViewedStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Recently Viewed</h1>
        <p className="text-muted-foreground">View and revisit products you've recently browsed.</p>
        <div className="flex items-center justify-center p-12 bg-white dark:bg-card border rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recently Viewed</h1>
          <p className="text-muted-foreground">View and revisit products you've recently browsed.</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearItems}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-12 border rounded-xl bg-white dark:bg-card text-center space-y-3">
          <Eye className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No recently viewed products</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Browse our catalog to see products you've viewed listed here for easy access.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            <ShoppingCart className="h-4 w-4" />
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((product) => (
            <ProductCard key={product.id || product.slug} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
