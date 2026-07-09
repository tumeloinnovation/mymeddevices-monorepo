import React, { useState } from 'react'
import RelatedProductsModal from './RelatedProductsModal'
import PriceTag from './PriceTag'
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

  return (
    <div>
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{product.name}</h1>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
        <p>SKU: <span className="font-medium">{product.sku}</span></p>
        {product.model_number && (
          <p>Model: <span className="font-medium">{product.model_number}</span></p>
        )}
      </div>

      {product.brands && product.brands.length > 0 && (
        <p className="text-sm text-gray-500 mt-1">
          Brand: <span className="font-medium">{product.brands[0].name}</span>
        </p>
      )}

      {((product.categories && product.categories.length > 0) || (product.tags && product.tags.length > 0)) && (
        <div className="mt-3 mb-3 flex flex-wrap gap-1.5 items-center">
          {product.categories?.map((cat) => (
            <Badge key={cat.id} className="text-xs">{cat.name}</Badge>
          ))}
          {product.tags?.map((tag) => (
            <Badge key={tag.name} variant="outline" className="text-xs bg-gray-50 dark:bg-muted text-gray-600 dark:text-gray-300">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {product.short_description && (
        <div
          className="mt-4 text-gray-700"
          dangerouslySetInnerHTML={{ __html: product.short_description }}
        />
      )}

        <div className="mt-4 gap-4">
          <PriceTag price={parseFloat(product.price)} mrp={parseFloat(product.regular_price)} />
          <div className="mt-1 text-sm text-gray-700">Total: <span className="font-semibold">Ksh. {formatCurrency(parseFloat(product.price) * quantity)}</span></div>
          <div className="mt-1 text-sm text-gray-600">Delivery from <span className="font-semibold">KSh 170</span> around Nairobi</div>
        </div>



      <div className="mt-6">
        {/* Add to cart and WhatsApp - stack on small screens */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-full sm:w-auto">
            {!added ? (
              <Button
                onClick={() => {
                  addToCart()
                  setAdded(true)
                }}
                className="w-full sm:min-w-[180px]"
              >
                Add to cart
              </Button>
            ) : (
              <div className="flex items-center border rounded-md overflow-hidden transition-all duration-200 w-full sm:w-auto">
                <button
                  type="button"
                  aria-label={quantity <= 1 ? 'remove from cart' : 'decrease'}
                  onClick={() => {
                    if (quantity <= 1) {
                      // remove from cart UI
                      setAdded(false)
                      // inform cart (qty 0 = remove)
                      addToCart(0)
                      // keep quantity at 1 (or optionally reset to 1)
                      setQuantity(1)
                      return
                    }

                    const newQty = quantity - 1
                    setQuantity(newQty)
                    addToCart(newQty)
                  }}
                  className={`px-3 py-2 ${quantity <= 1 ? 'text-red-600 hover:bg-red-50' : 'hover:bg-gray-100'}`}
                >
                  -
                </button>

                <div className="px-6 py-2 font-medium" aria-live="polite">{quantity}</div>

                <button
                  type="button"
                  aria-label="increase"
                  onClick={() => {
                    const newQty = quantity + 1
                    setQuantity(newQty)
                    addToCart(newQty)
                  }}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            )}
          </div>

          <div className="w-full sm:w-auto">
            <DirectCheckout
              productName={product.name}
              price={parseFloat(product.price)}
              quantity={quantity}
              className="w-full sm:min-w-[220px]"
              onAddToCart={() => {
                // ensure cart UI is in added state when user checks out
                addToCart()
                setAdded(true)
              }}
            />
          </div>
        </div>
      </div>
        <div className="flex items-center gap-5 mt-6  ">
          {/* Wishlist / Compare / Share with labels (labels shown on md+) */}
                    <div className="flex flex-col items-center text-center">
            <Button variant="ghost" size="icon" onClick={handleWishlistToggle} aria-label="wishlist">
              <Heart className={`h-4 w-4 ${wishlistHydrated && isInWishlist(product.id) ? 'fill-current text-red-500' : ''}`} />
            </Button>
            <span className="mt-1 text-xs text-gray-500 hidden md:block">Wishlist</span>
          </div>

          <div className="flex flex-col items-center text-center">
            <Button variant="ghost" size="icon" onClick={handleCompareToggle} disabled={!isInCompare(product.id) && !canAddMoreCompare()} aria-label="compare">
              <GitCompare className={`h-4 w-4 ${compareHydrated && isInCompare(product.id) ? 'fill-current text-blue-500' : ''}`} />
            </Button>
            <span className="mt-1 text-xs text-gray-500 hidden md:block">Compare</span>
          </div>

          <div className="flex flex-col items-center text-center">
            <Popover open={isShareOpen} onOpenChange={setIsShareOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={isShareOpen ? 'Share menu open' : 'Share'}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2" side="bottom" align="center">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2 justify-start h-8"
                  >
                    <Facebook className="h-4 w-4 text-blue-600" />
                    <span className="text-xs">Share on Facebook</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2 justify-start h-8"
                  >
                    <Twitter className="h-4 w-4 text-black dark:text-white" />
                    <span className="text-xs">Share on X</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-2 justify-start h-8"
                  >
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs">Share on WhatsApp</span>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <span className="mt-1 text-xs text-gray-500 hidden md:block">Share</span>
          </div>
          {/* inquiry */}
          {/* <div className="flex flex-col items-center text-center">
            <Button variant="ghost" size="icon" aria-label="inquiry">
              <MessageCircle className="h-4 w-4" />
            </Button>
            <span className="mt-1 text-xs text-gray-500 hidden md:block">Inquiry</span>
          </div> */}
        </div>

        <RelatedProductsModal
          isOpen={isRelatedModalOpen}
          onClose={() => setIsRelatedModalOpen(false)}
          product={product}
        />
    </div>
  )
}
