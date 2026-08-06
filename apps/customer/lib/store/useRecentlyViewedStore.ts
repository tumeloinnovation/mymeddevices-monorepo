import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/lib/data/types'

type RecentlyViewedStore = {
  items: Product[]
  addProduct: (product: Product) => void
  clearItems: () => void
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      items: [],
      addProduct: (product) =>
        set((state) => {
          if (!product || !product.id) return state
          const filtered = state.items.filter((p) => p.id !== product.id && p.slug !== product.slug)
          return { items: [product, ...filtered].slice(0, 20) }
        }),
      clearItems: () => set({ items: [] }),
    }),
    { name: 'recently_viewed_products' }
  )
)
