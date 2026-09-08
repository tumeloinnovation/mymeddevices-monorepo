'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Star,
  Truck,
  ShieldCheck,
  Award,
  HeadphonesIcon,
  Trash2,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Zap,
  Heart,
  Share2,
  GitCompare,
  MessageCircle,
  Facebook,
  Twitter,
  Plus,
  Minus,
  Loader2,
} from 'lucide-react'
import RelatedProductsModal from './RelatedProductsModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Product } from '@/lib/data/types'
import { useCompareStore } from '@/lib/store/useCompareStore'
import useCartStore from '@/lib/store/useCartStore'
import { useWishlistStore } from '@/lib/store/useWishlistStore'
import { formatCurrency } from '@/lib/utils/utils'
import { SafeHtml } from '@mymeddevices/shared-ui'
import { toast } from 'sonner'

type Props = {
  product: Product
  quantity: number
  setQuantity: (n: number) => void
  relatedProducts?: Product[]
  hidePurchaseActions?: boolean
  extraPrice?: number
}

export default function ProductInfo({ product, quantity, setQuantity, relatedProducts, hidePurchaseActions = false, extraPrice = 0 }: Props) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  const addToCartStore = useCartStore((state) => state.addItem)
  const updateQuantityStore = useCartStore((state) => state.updateQuantity)
  const removeFromCart = useCartStore((state) => state.removeItem)
  const addToWishlist = useWishlistStore((state) => state.addItem)
  const removeFromWishlist = useWishlistStore((state) => state.removeItem)
  const wishlistItems = useWishlistStore((state) => state.items)
  const wishlistHydrated = useWishlistStore((state) => state.hydrated)
  const addToCompare = useCompareStore((state) => state.addItem)
  const removeFromCompare = useCompareStore((state) => state.removeItem)
  const compareItems = useCompareStore((state) => state.items)
  const compareHydrated = useCompareStore((state) => state.hydrated)
  const canAddMoreCompare = useCompareStore((state) => state.canAddMore)

  const [isRelatedModalOpen, setIsRelatedModalOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)

  // Variants list
  const variants = useMemo(() => product?.variants || [], [product?.variants])

  // Group variants by attribute type
  const variantGroups = useMemo(() => {
    if (variants.length === 0) return {}

    const groups: Record<string, Set<string>> = {}
    variants.forEach((variant) => {
      if (variant.attributes && typeof variant.attributes === 'object') {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          if (value && typeof value === 'string' && value.trim()) {
            if (!groups[key]) groups[key] = new Set()
            groups[key].add(value)
          }
        })
      }
    })

    const result: Record<string, string[]> = {}
    Object.entries(groups).forEach(([key, values]) => {
      if (values.size > 0) {
        result[key] = Array.from(values)
      }
    })
    return result
  }, [variants])

  const attributeKeys = useMemo(() => Object.keys(variantGroups), [variantGroups])
  const hasAttributeVariants = variants.length > 0 && attributeKeys.length > 0
  const hasNamedVariants = variants.length > 0 && attributeKeys.length === 0

  // Selected variant ID for direct variant selection (if variants have no attributes)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    if (!variants || variants.length === 0) return null
    const defaultV = variants.find((v) => v.is_default && v.is_active !== false) || variants.find((v) => v.is_active !== false) || variants[0]
    return defaultV?.id || null
  })

  // Selected attributes map
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(() => {
    if (!variants || variants.length === 0) return {}
    const defaultVariant = variants.find((v) => v.is_default && v.is_active !== false) || variants.find((v) => v.is_active !== false) || variants[0]
    const initial: Record<string, string> = { ...(defaultVariant?.attributes || {}) }
    attributeKeys.forEach((key) => {
      if (!initial[key] && variantGroups[key]?.[0]) {
        initial[key] = variantGroups[key][0]
      }
    })
    return initial
  })

  // Synchronize variant selection on product/variant changes
  useEffect(() => {
    if (!variants || variants.length === 0) {
      setSelectedVariantId(null)
      setSelectedAttributes({})
      return
    }

    const defaultV = variants.find((v) => v.is_default && v.is_active !== false) || variants.find((v) => v.is_active !== false) || variants[0]

    if (hasAttributeVariants) {
      setSelectedAttributes((prev) => {
        const next: Record<string, string> = {}
        attributeKeys.forEach((key) => {
          if (prev[key] && variantGroups[key]?.includes(prev[key])) {
            next[key] = prev[key]
          } else if (defaultV?.attributes?.[key]) {
            next[key] = defaultV.attributes[key]
          } else if (variantGroups[key]?.[0]) {
            next[key] = variantGroups[key][0]
          }
        })
        return next
      })
    }

    if (hasNamedVariants || (!hasAttributeVariants && variants.length > 0)) {
      setSelectedVariantId((prev) => {
        if (prev && variants.some((v) => v.id === prev && v.is_active !== false)) {
          return prev
        }
        return defaultV?.id || null
      })
    }
  }, [product.id, variants, hasAttributeVariants, hasNamedVariants, attributeKeys, variantGroups])

  // Determine currently active variant matching all chosen attributes or selected variant id
  const activeVariant = useMemo(() => {
    if (variants.length === 0) return null
    if (hasAttributeVariants) {
      const allSelected = attributeKeys.length > 0 && attributeKeys.every((k) => Boolean(selectedAttributes[k]))
      if (allSelected) {
        const found = variants.find(
          (v) =>
            v.is_active !== false &&
            Object.entries(selectedAttributes).every(([k, val]) => v.attributes?.[k] === val)
        )
        if (found) return found
      }
      return variants.find((v) => v.is_default && v.is_active !== false) || variants.find((v) => v.is_active !== false) || variants[0] || null
    }
    // Named variants without attribute key-values
    if (selectedVariantId) {
      const found = variants.find((v) => v.id === selectedVariantId && v.is_active !== false)
      if (found) return found
    }
    return variants.find((v) => v.is_default && v.is_active !== false) || variants.find((v) => v.is_active !== false) || variants[0] || null
  }, [variants, hasAttributeVariants, attributeKeys, selectedAttributes, selectedVariantId])

  const requiresVariantSelection = hasAttributeVariants && !activeVariant
  const isBundle = product.product_type === 'bundle' || product.type === 'bundle'

  // Cart item key for variant or base product
  const cartItemKey = activeVariant ? `${product.id}-${activeVariant.id}` : String(product.id)
  const isInCart = useCartStore((state) => state.isInCart(product.id, activeVariant?.id))
  const cartQuantity = useCartStore((state) => state.getItemQuantity(product.id, activeVariant?.id))

  // Sync quantity with cart store when variant or product changes
  useEffect(() => {
    if (isInCart && cartQuantity > 0) {
      setQuantity(cartQuantity)
    } else {
      setQuantity(1)
    }
  }, [isInCart, cartQuantity, activeVariant?.id, setQuantity])

  // Base price (promotional/regular aware)
  const basePrice = useMemo(() => {
    if (product.on_sale && product.sale_price) {
      return parseFloat(product.sale_price) || 0
    }
    return parseFloat(product.price) || 0
  }, [product.on_sale, product.sale_price, product.price])

  const regularPrice = useMemo(() => {
    return parseFloat(product.regular_price || product.price) || 0
  }, [product.regular_price, product.price])

  // Current active unit price
  const currentPrice = useMemo(() => {
    let price = basePrice
    if (activeVariant) {
      if (activeVariant.calculated_price !== undefined && activeVariant.calculated_price !== null && !isNaN(Number(activeVariant.calculated_price))) {
        price = Number(activeVariant.calculated_price)
      } else if (activeVariant.override_price !== undefined && activeVariant.override_price !== null && !isNaN(Number(activeVariant.override_price))) {
        price = Number(activeVariant.override_price)
      } else if (activeVariant.price !== undefined && activeVariant.price !== null && !isNaN(Number(activeVariant.price))) {
        price = Number(activeVariant.price)
      } else if (activeVariant.price_adjustment !== undefined && activeVariant.price_adjustment !== null) {
        price = basePrice + Number(activeVariant.price_adjustment)
      }
    }
    return price + (extraPrice || 0)
  }, [activeVariant, basePrice, extraPrice])

  // Total price for display
  const totalPrice = useMemo(() => {
    return currentPrice * quantity
  }, [currentPrice, quantity])

  // Price range for unselected variable products
  const priceRange = useMemo(() => {
    if (variants.length === 0) return null
    const prices = variants.map((v) => {
      if (v.calculated_price !== undefined && v.calculated_price !== null) return Number(v.calculated_price)
      if (v.override_price !== undefined && v.override_price !== null) return Number(v.override_price)
      if (v.price !== undefined && v.price !== null) return Number(v.price)
      return basePrice + Number(v.price_adjustment || 0)
    })
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    if (min === max || isNaN(min) || isNaN(max)) return null
    return { min, max }
  }, [variants, basePrice])

  // Stock calculations
  const rawStock = activeVariant?.stock_quantity ?? product.stock_quantity
  const availableStock = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : 9999
  const isOutOfStock = product.stock_status === 'outofstock' || (
    Boolean(product.manage_stock) && availableStock <= 0
  )

  // Cart operations
  const handleAddToCart = () => {
    if (requiresVariantSelection) {
      toast.error('Please select all product options before adding to cart.')
      return
    }

    if (isOutOfStock) {
      toast.error('This product is currently out of stock.')
      return
    }

    setIsAdding(true)

    const itemToAdd: any = {
      ...product,
      id: cartItemKey,
      product_id: String(product.id),
      product_variant_id: activeVariant?.id || undefined,
      name: activeVariant
        ? `${product.name} (${activeVariant.name || Object.values(activeVariant.attributes || {}).join(', ')})`
        : product.name,
      sku: activeVariant?.sku || product.sku,
      price: currentPrice,
      regular_price: regularPrice,
      sale_price: product.sale_price,
      on_sale: product.on_sale,
      images: activeVariant?.image_url ? [{ src: activeVariant.image_url }] : product.images,
      stock_quantity: availableStock,
      manage_stock: product.manage_stock,
      quantity: quantity,
    }

    try {
      addToCartStore(itemToAdd, quantity)
      toast.success(`Added ${quantity > 1 ? `${quantity}x ` : ''}"${product.name}" to cart!`)
      setIsAdded(true)
      setTimeout(() => setIsAdded(false), 2500)
    } catch (err) {
      console.error('Failed to add to cart:', err)
      toast.error('Failed to add item to cart.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = () => {
    if (requiresVariantSelection) {
      toast.error('Please select all product options first.')
      return
    }
    if (isOutOfStock) {
      toast.error('This product is currently out of stock.')
      return
    }
    handleAddToCart()
    router.push('/checkout')
  }

  const handleQuantityUpdate = (newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemKey, activeVariant?.id)
      setQuantity(1)
      toast.info('Item removed from cart')
    } else {
      setQuantity(newQty)
      updateQuantityStore(cartItemKey, newQty, activeVariant?.id)
    }
  }

  const isInWishlist = (id: number | string) =>
    wishlistItems.some((item) => item.id === id || item.sku === id)
  const isInCompare = (id: number | string) =>
    compareItems.some((item) => item.id === id || item.sku === id || item.slug === id)

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product as any)
    }
  }

  const handleCompareToggle = () => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id)
    } else if (canAddMoreCompare()) {
      addToCompare(product as any)
      setIsRelatedModalOpen(true)
    }
  }

  const handleShare = (platform: string) => {
    const url = `${window.location.origin}/products/${product.slug}`
    const text = `Check out this product: ${product.name}`

    let shareUrl = ''
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
        break
      default:
        return
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer')
    setIsShareOpen(false)
  }

  const trustSignals = [
    {
      icon: Truck,
      title: 'Free Delivery',
      description: 'On orders over KES 50,000',
    },
    {
      icon: ShieldCheck,
      title: '2-Year Warranty',
      description: 'Comprehensive coverage',
    },
    {
      icon: Award,
      title: 'Certified Authentic',
      description: '100% genuine equipment',
    },
    {
      icon: HeadphonesIcon,
      title: '24/7 Support',
      description: 'Expert assistance anytime',
    },
  ]

  if (!product) return null

  return (
    <div className="space-y-5">
      {/* Product Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {product.name}
        </h1>
        {/* Brand */}
        {product.brands && product.brands.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            by <span className="font-medium text-gray-900 dark:text-gray-100">{product.brands[0].name}</span>
          </p>
        )}
      </div>

      {/* Stock Status, Rating & Reviews */}
      <div className="flex items-center flex-wrap gap-3">
        {!isOutOfStock ? (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            IN STOCK {product.manage_stock && typeof rawStock === 'number' && rawStock > 0 ? `(${rawStock})` : ''}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-red-600 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
            OUT OF STOCK
          </Badge>
        )}
        {product.on_sale && (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800 font-medium">
            Sale
          </Badge>
        )}
        {isBundle && (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            BUNDLE KIT
          </Badge>
        )}

        {/* Rating & Reviews */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(parseFloat((product as any)?.average_rating || (product as any)?.popularity_score / 10 || 0))
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {(parseFloat((product as any)?.average_rating || (product as any)?.popularity_score / 10 || 0)).toFixed(1)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({(product as any)?.rating_count || (product as any)?.view_count || 0} reviews)
          </span>
        </div>
      </div>

      {/* Price Section */}
      <div className="space-y-1">
        <div className="flex items-baseline flex-wrap gap-2">
          {priceRange && requiresVariantSelection ? (
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-mono">
              KES {formatCurrency(priceRange.min)} — KES {formatCurrency(priceRange.max)}
            </span>
          ) : (
            <span className="text-3xl font-bold text-primary font-mono">
              KES {formatCurrency(currentPrice)}
            </span>
          )}
          {product.on_sale && regularPrice > currentPrice && (
            <span className="text-lg text-gray-400 line-through font-mono">
              KES {formatCurrency(regularPrice)}
            </span>
          )}
        </div>
        {quantity > 1 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total ({quantity} items): <span className="font-semibold text-gray-900 dark:text-gray-100 font-mono">KES {formatCurrency(totalPrice)}</span>
          </p>
        )}
      </div>


      {/* Variant Selection (Attribute-based) */}
      {!isBundle && hasAttributeVariants && (
        <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Product Options</h3>
            {requiresVariantSelection && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Please select all options
              </span>
            )}
          </div>
          {Object.entries(variantGroups).map(([attrName, options]) => (
            <div key={attrName} className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {attrName.replace(/_/g, ' ')}: <span className="text-primary font-medium">{selectedAttributes[attrName] || 'Choose'}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                  const isSelected = selectedAttributes[attrName] === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setSelectedAttributes((prev) => ({
                          ...prev,
                          [attrName]: option,
                        }))
                      }}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-102'
                          : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Variant Selection (Name-based fallback when attributes aren't key-value) */}
      {!isBundle && hasNamedVariants && (
        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Product Options</h3>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isSelected = activeVariant?.id === v.id
              const vPrice = v.calculated_price ?? v.override_price ?? v.price ?? (basePrice + (v.price_adjustment || 0))
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <span>{v.name || 'Option'}</span>
                  {vPrice > 0 && <span className="text-xs opacity-80">(KES {formatCurrency(vPrice)})</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Short Description */}
      {product.short_description && (
        <SafeHtml
          className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
          html={product.short_description}
        />
      )}

      {/* Categories and Tags */}
      {((product.categories && product.categories.length > 0) || (product.tags && product.tags.length > 0)) && (
        <div className="flex flex-wrap gap-2 items-center">
          {product.categories?.map((cat) => (
            <Badge key={cat.id} variant="outline" className="text-xs">
              {cat.name}
            </Badge>
          ))}
          {product.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag.name} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Wishlist, Compare, Share */}
      <div className="flex items-center gap-6">
        <button
          onClick={handleWishlistToggle}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <Heart className={`h-4 w-4 ${wishlistHydrated && isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
          <span>Wishlist</span>
        </button>

        <button
          onClick={handleCompareToggle}
          disabled={!isInCompare(product.id) && !canAddMoreCompare()}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GitCompare className={`h-4 w-4 ${compareHydrated && isInCompare(product.id) ? 'fill-blue-500 text-blue-500' : ''}`} />
          <span>Compare</span>
        </button>

        <Popover open={isShareOpen} onOpenChange={setIsShareOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-2" side="top" align="end">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShare('facebook')}
                className="flex items-center gap-2 justify-start h-8"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShare('twitter')}
                className="flex items-center gap-2 justify-start h-8"
              >
                <Twitter className="h-4 w-4 text-black dark:text-white" />
                <span className="text-xs">X (Twitter)</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShare('whatsapp')}
                className="flex items-center gap-2 justify-start h-8"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs">WhatsApp</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Action Buttons */}
      {!hidePurchaseActions && (
        <div className="flex flex-col gap-3 pt-2">
          {isInCart && cartQuantity > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {/* Quantity Controls in Cart */}
                <div className="flex items-center justify-between border border-border bg-card rounded-xl overflow-hidden h-11 w-32 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuantityUpdate(quantity - 1)}
                    className="w-10 h-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="flex-1 font-semibold text-foreground text-center text-sm font-mono select-none">
                    {quantity}
                  </div>
                  <button
                    type="button"
                    disabled={Boolean(product.manage_stock) && typeof availableStock === 'number' && quantity >= availableStock}
                    onClick={() => handleQuantityUpdate(quantity + 1)}
                    className="w-10 h-full hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* View Cart & Checkout Button */}
                <Button
                  asChild
                  className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Link href="/cart">
                    <ShoppingCart className="h-4 w-4" />
                    <span>View Cart & Checkout</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                {/* Remove from Cart */}
                <Button
                  variant="outline"
                  onClick={() => {
                    removeFromCart(cartItemKey, activeVariant?.id)
                    setQuantity(1)
                    toast.info('Item removed from cart')
                  }}
                  className="h-11 w-11 shrink-0 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-border cursor-pointer"
                  title="Remove from Cart"
                  aria-label="Remove from Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Added to cart indicator / Direct checkout link */}
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-4 w-4" /> Item is in your cart ({quantity} {quantity === 1 ? 'unit' : 'units'})
                </span>
                <Link href="/checkout" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                  Direct Checkout <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {/* Quantity Controls Before Cart */}
                <div className="flex items-center justify-between border border-border bg-card rounded-xl overflow-hidden h-11 w-32 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-10 h-full hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="flex-1 font-semibold text-foreground text-center text-sm font-mono select-none">
                    {quantity}
                  </div>
                  <button
                    type="button"
                    disabled={isOutOfStock || (Boolean(product.manage_stock) && typeof availableStock === 'number' && quantity >= availableStock)}
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-full hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add to Cart button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || requiresVariantSelection || isAdding}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium h-11 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : isAdded ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      <span>
                        {isOutOfStock
                          ? 'Out of Stock'
                          : requiresVariantSelection
                          ? 'Select Options to Add to Cart'
                          : quantity > 1
                          ? `Add ${quantity} to Cart`
                          : 'Add to Cart'}
                      </span>
                    </>
                  )}
                </Button>
              </div>

              {/* Buy Now button */}
              {!isOutOfStock && !requiresVariantSelection && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBuyNow}
                  disabled={isAdding}
                  className="w-full h-10 border-primary/30 text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>Buy Now with Instant Checkout</span>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trust Signals */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        {trustSignals.map((signal) => {
          const Icon = signal.icon
          return (
            <div key={signal.title} className="flex items-center gap-2">
              <div className="text-gray-500 dark:text-gray-400">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{signal.title}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{signal.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      <RelatedProductsModal
        isOpen={isRelatedModalOpen}
        onClose={() => setIsRelatedModalOpen(false)}
        product={product}
      />
    </div>
  )
}
