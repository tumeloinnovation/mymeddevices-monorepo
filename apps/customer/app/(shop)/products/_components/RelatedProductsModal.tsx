import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/data/types";
import { formatCurrency } from "@/lib/utils/utils";
import { trackProductView } from "@/lib/utils/metrics";
import { SEED_PRODUCTS } from "@/lib/data/seed/products";
import { ShoppingCart, Heart, GitCompare } from "lucide-react";
import useCartStore from "@/lib/store/useCartStore";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { useCompareStore } from "@/lib/store/useCompareStore";

interface RelatedProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const RelatedProductsModal: React.FC<RelatedProductsModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const addToCart = useCartStore((state) => state.addItem);
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

  const relatedProducts = useMemo(() => {
    if (!product || !isOpen) return [];
    
    const categoryIds = product.categories?.map(c => c.id) || [];
    return SEED_PRODUCTS.filter(p => 
      p.id !== product.id && 
      p.categories?.some(c => categoryIds.includes(c.id))
    ).slice(0, 6);
  }, [product, isOpen]);

  useEffect(() => {
    if (isOpen && product) {
       setLoading(true);
       const timer = setTimeout(() => setLoading(false), 500);
       return () => clearTimeout(timer);
    }
  }, [isOpen, product]);

  const handleNavigateToDetails = (prod: Product) => {
    trackProductView(prod.id, prod.name);
    router.push(`/products/${prod.slug}`);
    onClose();
  };

  const handleAddToCart = (prod: Product) => {
    addToCart(prod, 1);
  };

  const handleWishlistToggle = (prod: Product) => {
    if (isInWishlist(prod.id)) {
      removeFromWishlist(prod.id);
    } else {
      addToWishlist(prod);
    }
  };

  const handleCompareToggle = (prod: Product) => {
    if (isInCompare(prod.id)) {
      removeFromCompare(prod.id);
    } else if (canAddMoreCompare()) {
      addToCompare(prod);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Related Products</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : relatedProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No related products found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {relatedProducts.map((prod) => {
              const imageUrl = prod.images?.[0]?.src || '';
              const name = prod.name || '';
              const category = prod.categories?.[0]?.name || '';
              const price = parseFloat(prod.on_sale ? prod.sale_price : prod.price) || 0;
              const originalPrice = prod?.on_sale ? parseFloat(prod.regular_price) : undefined;
              const hasDiscount = typeof originalPrice === "number" && originalPrice > price;

              return (
                <Card key={prod.id} className="group w-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col bg-card border border-border min-h-[320px]">
                  {/* Image Section */}
                  <div className="relative bg-white dark:bg-muted/30 h-32">
                    {imageUrl && (
                      <Image
                        fill
                        src={imageUrl}
                        alt={name}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        style={{ objectFit: 'contain' }}
                        className="transition-transform duration-300 ease-in-out group-hover:scale-[1.02]"
                      />
                    )}
                    {/* Action buttons */}
                    <div className="absolute right-2 top-2 flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWishlistToggle(prod);
                        }}
                        className={`bg-white/80 dark:bg-black/40 p-1 rounded-full shadow-sm ${
                          wishlistHydrated && isInWishlist(prod.id) ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'
                        }`}
                        aria-label={wishlistHydrated && isInWishlist(prod.id) ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart className={`h-3 w-3 ${wishlistHydrated && isInWishlist(prod.id) ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompareToggle(prod);
                        }}
                        disabled={!isInCompare(prod.id) && !canAddMoreCompare()}
                        className={`bg-white/80 dark:bg-black/40 p-1 rounded-full shadow-sm ${
                          compareHydrated && isInCompare(prod.id) ? 'text-blue-500' : 'text-gray-700 dark:text-gray-200'
                        }`}
                        aria-label={compareHydrated && isInCompare(prod.id) ? "Remove from compare" : "Add to compare"}
                      >
                        <GitCompare className={`h-3 w-3 ${compareHydrated && isInCompare(prod.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-3 flex flex-col justify-between flex-1">
                    <div onClick={() => handleNavigateToDetails(prod)} className="cursor-pointer">
                      {category && (
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                          {category}
                        </p>
                      )}
                      <h3 className="text-sm font-medium leading-tight text-foreground line-clamp-2">
                        {name}
                      </h3>
                    </div>

                    {/* Price Section */}
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-sm font-semibold text-primary">
                        Ksh. {formatCurrency(price)}
                      </p>
                      {hasDiscount && (
                        <span className="text-xs text-muted-foreground line-through">
                          Ksh. {formatCurrency(originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <div className="mt-3">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(prod);
                        }}
                        className="w-full h-8 rounded-md shadow-sm text-xs font-medium hover:brightness-95 flex items-center justify-center gap-1"
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="h-3 w-3" />
                        Add to cart
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RelatedProductsModal;
