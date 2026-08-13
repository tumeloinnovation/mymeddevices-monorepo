import React, { useState, useMemo } from 'react'
import { Star, Truck, ShieldCheck, Award, HeadphonesIcon, ChevronDown } from 'lucide-react'
import RelatedProductsModal from './RelatedProductsModal'
import DirectCheckout from '../../../checkout/_components/DirectCheckout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Heart, Share2, GitCompare, MessageCircle, Facebook, Twitter } from 'lucide-react'
import { Product } from '@/lib/data/types'
import { useCompareStore } from '@/lib/store/useCompareStore'
import useCartStore  from '@/lib/store/useCartStore'
import { useWishlistStore } from '@/lib/store/useWishlistStore'
import { formatCurrency } from '@/lib/utils/utils'

type Props = {
  product: Product
  quantity: number
  setQuantity: (n: number) => void
}

export default function ProductInfo({ product, quantity, setQuantity }: Props) {
  const addToCartStore = useCartStore((state) => state.addItem);
  const updateQuantityStore = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeItem);
  const addToWishlist = useWishlistStore((state) => state.addItem);
  const removeFromWishlist = useWishlistStore((state) => state.removeItem);
  const wishlistItems = useWishlistStore((state) => state.items);
  const wishlistHydrated = useWishlistStore((state) => state.hydrated);
  const addToCompare = useCompareStore((state) => state.addItem);
  const removeFromCompare = useCompareStore((state) => state.removeItem);
  const compareItems = useCompareStore((state) => state.items);
  const compareHydrated = useCompareStore((state) => state.hydrated);
  const canAddMoreCompare = useCompareStore((state) => state.canAddMore);

  const isInWishlist = (id: number | string) => wishlistItems.some((item) => item.id === id || item.sku === id);
  const isInCompare = (id: number | string) => compareItems.some((item) => item.id === id || item.sku === id || item.slug === id);

  const addToCart = (qty: number = quantity) => {
    if (qty === 0) {
      removeFromCart(product.id);
      return;
    }
    if (qty === 1) {
      addToCartStore(product as any, qty);
    } else {
      updateQuantityStore(product.id, qty);
    }
  }

  const [added, setAdded] = useState(false)
  const [isRelatedModalOpen, setIsRelatedModalOpen] = useState(false)

  // Variant selection state
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)

  // Get available variants
  const variants = product.variants || []

  // Calculate current price based on selected variant or base price
  const currentPrice = useMemo(() => {
    if (selectedVariant) {
      const variant = variants.find(v => v.id === selectedVariant)
      if (variant) return variant.price
    }
    return parseFloat(product.price) || 0
  }, [selectedVariant, variants, product.price])

  // Total price for display
  const totalPrice = useMemo(() => {
    return currentPrice * quantity
  }, [currentPrice, quantity])

  // Calculate price range for variable products
  const priceRange = useMemo(() => {
    if (variants.length === 0) return null;
    const prices = variants.map(v => (v as any).calculated_price || (v as any).override_price || (parseFloat(product.price) + ((v as any).price_adjustment || 0)));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max || isNaN(min) || isNaN(max)) return null;
    return { min, max };
  }, [variants, product.price]);

  const requiresVariantSelection = product.product_type === 'variable' && variants.length > 0 && !selectedVariant;
  const isBundle = product.product_type === 'bundle';

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product as any);
    }
  };

  const handleCompareToggle = () => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
    } else if (canAddMoreCompare()) {
      // store the full Product object in compare
      addToCompare(product as any);
      setIsRelatedModalOpen(true);
    }
  };

  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleShare = (platform: string) => {
    const url = `${window.location.origin}/products/${product.slug}`;
    const text = `Check out this product: ${product.name}`;

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    setIsShareOpen(false);
  };

  const price = parseFloat(product.price) || 0

  // Group variants by attribute type
  const variantGroups = useMemo(() => {
    if (variants.length === 0) return {}

    const groups: Record<string, Set<string>> = {}
    variants.forEach(variant => {
      Object.entries(variant.attributes).forEach(([key, value]) => {
        if (!groups[key]) groups[key] = new Set()
        groups[key].add(value)
      })
    })

    // Convert Sets to arrays
    const result: Record<string, string[]> = {}
    Object.entries(groups).forEach(([key, values]) => {
      result[key] = Array.from(values)
    })
    return result
  }, [variants])

  // Get available variant combinations
  const getAvailableVariants = (selectedAttrs: Record<string, string>) => {
    return variants.filter(variant => {
      return Object.entries(selectedAttrs).every(([key, value]) =>
        variant.attributes[key] === value
      )
    })
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

      {/* Stock Status, Rating & Reviews - Combined Row */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Stock Status */}
        {product.stock_status === 'instock' ? (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            IN STOCK
          </Badge>
        ) : (
          <Badge variant="outline" className="text-gray-600">
            OUT OF STOCK
          </Badge>
        )}
        {product.on_sale && (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800">
            SALE
          </Badge>
        )}
        {isBundle && (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            BUNDLE KIT
          </Badge>
        )}

        {/* Rating & Reviews - Using real data */}
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
        <div className="flex items-baseline gap-2">
          {priceRange && !selectedVariant ? (
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-mono">
              KES {formatCurrency(priceRange.min)} — KES {formatCurrency(priceRange.max)}
            </span>
          ) : (
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-mono">
              KES {formatCurrency(currentPrice)}
            </span>
          )}
          {product.on_sale && product.sale_price && (
            <span className="text-lg text-gray-400 line-through font-mono">
              KES {formatCurrency(parseFloat(product.sale_price))}
            </span>
          )}
        </div>
        {quantity > 1 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total: <span className="font-semibold text-gray-900 dark:text-gray-100 font-mono">KES {formatCurrency(totalPrice)}</span>
          </p>
        )}
      </div>

      {/* Variant Selection */}
      {variants.length > 0 && Object.keys(variantGroups).length > 0 && (
        <div className="space-y-4">
          {Object.entries(variantGroups).map(([attrName, options]) => (
            <div key={attrName} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {attrName.replace(/_/g, ' ')}
              </label>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      // Find matching variant with this attribute
                      const matchingVariant = variants.find(v =>
                        v.attributes[attrName] === option
                      )
                      if (matchingVariant) {
                        setSelectedVariant(matchingVariant.id)
                      }
                    }}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedVariant && variants.find(v => v.id === selectedVariant)?.attributes[attrName] === option
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Short Description */}
      {product.short_description && (
        <div
          className="text-sm text-gray-600 dark:text-gray-400"
          dangerouslySetInnerHTML={{ __html: product.short_description }}
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

      {/* Quantity Selector with Add to Cart — hidden for bundles (BundleConfigurator owns this CTA) */}
      {!isBundle && (
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <div className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100 min-w-[50px] text-center">
              {quantity}
            </div>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <Button
            onClick={() => {
              addToCart()
              setAdded(true)
            }}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium"
            size="lg"
          >
            {added ? 'Added to Cart' : 'Add to Cart'}
          </Button>
        </div>
      )}

      {/* Buy Now Button — hidden for bundles */}
      {!isBundle && (
        <DirectCheckout
          productName={product.name}
          price={currentPrice}
          quantity={quantity}
          onAddToCart={() => {
            addToCart()
            setAdded(true)
          }}
        />
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
