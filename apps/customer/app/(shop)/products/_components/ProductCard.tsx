import React, { useState, useEffect } from "react";
import {
  Heart,
  Share2,
  GitCompare,
  Minus,
  Plus,
  Eye,
  X,
  CheckCircle2,
  ShoppingCart,
  Facebook,
  Twitter,
  MessageCircle,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCompareStore } from "@/lib/store/useCompareStore";
import Link from "next/link";
import type { Product } from "@/lib/hooks/useProducts";
import useCartStore from "@/lib/store/useCartStore";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { formatCurrency } from "@/lib/utils/utils";
import { trackProductView } from "@/lib/utils/metrics";
import RelatedProductsModal from "./RelatedProductsModal";

interface ProductCardProps {
  product?: Product | null | undefined;
  /** When true the card should display the "Added" state because the item is in cart */
  externalAdded?: boolean;
}

  const ProductCard: React.FC<ProductCardProps> = ({
  product,
  externalAdded = false,
}) => {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRelatedModalOpen, setIsRelatedModalOpen] = useState(false);


  // Extract product details
  const [imgSrc, setImgSrc] = useState(product?.images?.[0]?.src || (product?.images?.[0] as any)?.url || '/logos/logo-portrait.png');
  const name = product?.name || '';
  // Try multiple possible category field structures
  const category = product?.categories?.[0]?.name || (product as any)?.category_name || (product as any)?.category || '';
  const brandName = (product as any)?.brands?.[0]?.name || (product as any)?.brand || '';
  const price = product ? parseFloat(product.on_sale ? product.sale_price : product.price) : 0;
  const originalPrice = product?.on_sale ? parseFloat(product.regular_price) : undefined;
  const slug = product?.slug || (product as any)?.sku || (product as any)?.id || '';

  const hasDiscount =
    typeof originalPrice === "number" && originalPrice > price;

  const isNew = product?.date_created ? (new Date().getTime() - new Date(product.date_created).getTime()) < (7 * 24 * 60 * 60 * 1000) : false;

  const addToCart = useCartStore((state) => state.addItem);
  const updateCartQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeItem);
  const addToWishlist = useWishlistStore((state) => state.addItem);
  const removeFromWishlist = useWishlistStore((state) => state.removeItem);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);
  const wishlistHydrated = useWishlistStore((state) => state.hydrated);
  const wishlistItems = useWishlistStore((state) => state.items);

  const addToCompare = useCompareStore((state) => state.addItem);
  const removeFromCompare = useCompareStore((state) => state.removeItem);
  const isInCompare = useCompareStore((state) => state.isInCompare);
  const compareHydrated = useCompareStore((state) => state.hydrated);
  const compareItems = useCompareStore((state) => state.items);

  const productId = product?.id;
  const isInCart = useCartStore((state) => productId ? state.isInCart(productId) : false);
  const getItemQuantity = useCartStore((state) => productId ? state.getItemQuantity(productId) : 0);

  // Sync quantity with cart
  useEffect(() => {
    if (!product) return;
    if (isInCart) {
      setQuantity(getItemQuantity);
    } else {
      setQuantity(1);
    }
  }, [product, isInCart, getItemQuantity]);

  // Early return if product is not provided
  if (!product) {
    return null;
  }

  const handleNavigateToDetails = () => {
    // Track product view before navigation
    trackProductView(product.id, product.name);
    router.push(`/products/${slug}`);
  };

  const handleAddToCart = () => {
    addToCart(product as any, quantity);
  };

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
    } else {
      addToCompare(product as any);
      setIsRelatedModalOpen(true);
    }
  };

  const handleShare = (platform: string) => {
    const url = `${window.location.origin}/products/${slug}`;
    const text = `Check out this product: ${name}`;

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
    <>
      <Card className="group w-[220px] sm:w-[240px] md:w-[260px] rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col bg-card border border-border h-full">
        {/* Image Section */}
        <div onClick={handleNavigateToDetails} className="relative bg-white dark:bg-muted/30 h-40 sm:h-44 cursor-pointer">
          <Image
            fill
            src={imgSrc}
            alt={name}
            onError={() => setImgSrc('/logos/logo-portrait.png')}
            sizes="(max-width: 640px) 200px, (max-width: 768px) 220px, 240px"
            style={{ objectFit: 'contain' }}
            className="transition-transform duration-500 ease-in-out group-hover:scale-110 p-2"
          />

          {/* Status Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1 z-10">
            {(product as any)?.product_type === 'variable' && (
              <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                {product.variants?.length ? `${product.variants.length} Options` : 'Variable'}
              </div>
            )}
            {(product as any)?.product_type === 'bundle' && (
              <div className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                Kit · {(product as any)?.bundle_items?.length || 'Package'}
              </div>
            )}
            {hasDiscount && (
              <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                Sale
              </div>
            )}
            {isNew && (
              <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                New
              </div>
            )}
          </div>

          {/* Rating - Using popularity_score as proxy; will be replaced when review system is implemented */}
          <div className="absolute left-2 bottom-2 bg-white/90 dark:bg-black/40 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
            <span>{((product as any)?.popularity_score || 0) / 10}</span>
            <span className="text-muted-foreground">({(product as any)?.view_count || 0})</span>
          </div>

          <div className="absolute right-2 top-2 flex flex-col gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleWishlistToggle}
                  className={`bg-white/80 dark:bg-black/40 p-1.5 rounded-full shadow-sm opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ${
                    wishlistHydrated && isInWishlist(product.id) ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'
                  }`}
                  style={{ transitionDelay: `0ms` }}
                  aria-label={wishlistHydrated && isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`h-3.5 w-3.5 ${wishlistHydrated && isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{wishlistHydrated && isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}</p>
              </TooltipContent>
            </Tooltip>
            <Popover open={isShareOpen} onOpenChange={setIsShareOpen}>
              <PopoverTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`bg-white/80 dark:bg-black/40 p-1.5 rounded-full shadow-sm transition-all duration-300 text-gray-700 dark:text-gray-200 ${
                        isShareOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                      }`}
                      style={{ transitionDelay: `80ms` }}
                      aria-label={isShareOpen ? 'Share menu open' : 'Share'}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Share product</p>
                  </TooltipContent>
                </Tooltip>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2" side="right" align="start">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCompareToggle}
                  className={`bg-white/80 dark:bg-black/40 p-1.5 rounded-full shadow-sm opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ${
                    compareHydrated && isInCompare(product.id) ? 'text-blue-600' : 'text-gray-700 dark:text-gray-200'
                  }`}
                  style={{ transitionDelay: `160ms` }}
                  aria-label={compareHydrated && isInCompare(product.id) ? "Remove from compare" : "View related products"}
                >
                  <GitCompare className={`h-3.5 w-3.5 ${compareHydrated && isInCompare(product.id) ? 'fill-current' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{compareHydrated && isInCompare(product.id) ? "Remove from compare" : "Compare products"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-3 sm:px-4 py-2 flex flex-col justify-between flex-1">
          <div onClick={handleNavigateToDetails} className="cursor-pointer min-h-[2.5rem]">
            {category && (
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {category}
              </p>
            )}
            <h3 className="text-sm font-medium leading-tight text-foreground line-clamp-2 mt-0.5">
              {name}
            </h3>
            {brandName && (
              <p className="text-[11px] font-normal text-muted-foreground mt-0.5">
                by {brandName}
              </p>
            )}
          </div>

          {/* Price Section */}
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm font-semibold text-primary">
              Ksh. {formatCurrency(price)}
            </p>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                Ksh. {formatCurrency(originalPrice)}
              </span>
            )}
          </div>

          {/* Bottom Action Section */}
          <div className="mt-1 flex items-center gap-2 h-10">
            <motion.div className="flex-1 h-full">
              <AnimatePresence mode="wait" initial={false}>
                {!isInCart ? (
                  <motion.div
                    key="add-to-cart"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="h-full"
                  >
                    {(product.manage_stock ? (product.stock_quantity === null || product.stock_quantity <= 0) : product.stock_status === 'outofstock') ? (
                      <Button
                        disabled
                        className="w-full h-full rounded-md shadow-sm text-xs font-medium flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
                        aria-label="Out of stock"
                      >
                        Out of stock
                      </Button>
                    ) : (
                      <Button
                        onClick={handleAddToCart}
                        className="w-full h-full rounded-md shadow-sm text-xs font-medium hover:brightness-95 active:scale-[0.97] transition-transform duration-150 ease-out flex items-center justify-center gap-1.5"
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to cart
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="qty-panel"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="flex items-center justify-between h-full bg-muted/60 dark:bg-muted/30 backdrop-blur-md shadow-sm px-1 py-1 rounded-lg border border-border"
                  >
                    {/* Quantity controls */}
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newQuantity = quantity - 1;
                          if (newQuantity <= 0) {
                            removeFromCart(product.id);
                          } else {
                            updateCartQuantity(product.id, newQuantity);
                          }
                        }}
                        aria-label="Decrease"
                        className="h-8 w-8 active:scale-[0.9] transition-transform duration-150 ease-out"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <motion.div
                        key={quantity}
                        initial={{ opacity: 0.6, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-8 text-center font-semibold text-sm"
                      >
                        {quantity}
                      </motion.div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateCartQuantity(product.id, quantity + 1)}
                        aria-label="Increase"
                        className="h-8 w-8 active:scale-[0.9] transition-transform duration-150 ease-out"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Added indicator + clear */}
                    <div className="flex items-center">
                      <button
                        onClick={() => removeFromCart(product.id)}
                        aria-label="Remove item"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border text-muted-foreground hover:bg-accent active:scale-[0.9] transition-all duration-150 ease-out"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </Card>
      <RelatedProductsModal
        isOpen={isRelatedModalOpen}
        onClose={() => setIsRelatedModalOpen(false)}
        product={product}
      />
    </>
  );
};

export default ProductCard;
