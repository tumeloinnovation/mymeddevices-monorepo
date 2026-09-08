import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/data/types";
import { formatCurrency } from "@/lib/utils/utils";
import { trackProductView } from "@/lib/utils/metrics";
import { useProducts } from "@/lib/hooks/useProducts";
import {
  ShoppingCart,
  Heart,
  GitCompare,
  PackageSearch,
  Check,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import useCartStore from "@/lib/store/useCartStore";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { useCompareStore } from "@/lib/store/useCompareStore";
import { toast } from "sonner";

interface RelatedProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

type FilterTab = "all" | "category" | "budget";

const RelatedProductsModal: React.FC<RelatedProductsModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [addedItems, setAddedItems] = useState<Record<string | number, boolean>>({});

  const { products: allProducts } = useProducts({ per_page: 40 });

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

  const isInWishlist = (id: number | string) =>
    wishlistItems.some((item) => item.id === id || item.sku === id);
  const isInCompare = (id: number | string) =>
    compareItems.some(
      (item) => item.id === id || item.sku === id || item.slug === id
    );

  const relatedProducts = useMemo(() => {
    if (!product || !isOpen || !allProducts) return [];

    const categoryIds = product.categories?.map((c) => c.id) || [];
    
    // First, find products sharing categories
    let matching = allProducts.filter(
      (p) =>
        p.id !== product.id &&
        p.categories?.some((c) => categoryIds.includes(c.id))
    );

    // If matching category items is low, backfill with other products
    if (matching.length < 8) {
      const remaining = allProducts.filter(
        (p) => p.id !== product.id && !matching.some((m) => m.id === p.id)
      );
      matching = [...matching, ...remaining];
    }

    return matching.slice(0, 12);
  }, [product, isOpen, allProducts]);

  const filteredProducts = useMemo(() => {
    if (activeTab === "category") {
      const categoryIds = product?.categories?.map((c) => c.id) || [];
      return relatedProducts.filter((p) =>
        p.categories?.some((c) => categoryIds.includes(c.id))
      );
    }
    if (activeTab === "budget") {
      const mainPrice = parseFloat(product?.price || "0");
      return relatedProducts.filter((p) => {
        const pPrice = parseFloat(p.price || "0");
        return pPrice > 0 && (mainPrice === 0 || pPrice <= mainPrice * 1.2);
      });
    }
    return relatedProducts;
  }, [relatedProducts, activeTab, product]);

  useEffect(() => {
    if (isOpen && product) {
      setLoading(true);
      setActiveTab("all");
      const timer = setTimeout(() => setLoading(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, product]);

  const handleNavigateToDetails = (prod: Product) => {
    trackProductView(prod.id, prod.name);
    router.push(`/products/${prod.slug}`);
    onClose();
  };

  const handleAddToCart = (prod: Product) => {
    addToCart(prod as any, 1);
    setAddedItems((prev) => ({ ...prev, [prod.id]: true }));
    toast.success(`${prod.name} added to cart`);
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [prod.id]: false }));
    }, 2500);
  };

  const handleWishlistToggle = (prod: Product) => {
    if (isInWishlist(prod.id)) {
      removeFromWishlist(prod.id);
      toast.info(`Removed ${prod.name} from wishlist`);
    } else {
      addToWishlist(prod as any);
      toast.success(`Added ${prod.name} to wishlist`);
    }
  };

  const handleCompareToggle = (prod: Product) => {
    if (isInCompare(prod.id)) {
      removeFromCompare(prod.id);
      toast.info(`Removed ${prod.name} from comparison`);
    } else if (canAddMoreCompare()) {
      addToCompare(prod as any);
      toast.success(`Added ${prod.name} to product comparison`);
    } else {
      toast.warning("Comparison limit reached (max 4 products)");
    }
  };

  const mainCategoryName = product?.categories?.[0]?.name || "Medical Equipment";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94vw] max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl rounded-2xl bg-background">
        {/* Header Section */}
        <DialogHeader className="px-6 sm:px-8 py-5 border-b border-border/60 bg-slate-50/70 dark:bg-slate-900/40 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wide mb-1">
                <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                <span>Related & Compatible Equipment</span>
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Explore Complementary Products
              </DialogTitle>
              {product?.name && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected for{" "}
                  <span className="font-semibold text-foreground">
                    {product.name}
                  </span>{" "}
                  • Category:{" "}
                  <span className="font-medium text-primary">
                    {mainCategoryName}
                  </span>
                </p>
              )}
            </div>

            {/* Counter Badge */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="px-3 py-1 rounded-lg bg-background border border-border text-xs font-semibold text-foreground shadow-2xs">
                {filteredProducts.length} {filteredProducts.length === 1 ? "Item" : "Items"} Available
              </span>
            </div>
          </div>

          {/* Filter Tabs */}
          {relatedProducts.length > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === "all"
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                All Related ({relatedProducts.length})
              </button>
              <button
                onClick={() => setActiveTab("category")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === "category"
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                Same Category ({mainCategoryName})
              </button>
              <button
                onClick={() => setActiveTab("budget")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === "budget"
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                Similar Price Range
              </button>
            </div>
          )}
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-6 sm:px-8 py-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border/60 bg-card overflow-hidden animate-pulse flex flex-col h-[340px]"
                >
                  <div className="h-44 bg-muted/60" />
                  <div className="p-4 flex flex-col flex-1 gap-2.5">
                    <div className="h-3 bg-muted/80 rounded w-1/3" />
                    <div className="h-4 bg-muted/80 rounded w-full" />
                    <div className="h-4 bg-muted/80 rounded w-3/4" />
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="h-5 bg-muted/80 rounded w-1/2" />
                      <div className="h-8 bg-muted/80 rounded w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                <PackageSearch className="h-10 w-10 text-muted-foreground/60" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-foreground">No related products found</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  We couldn't find matches for this specific filter. Try selecting "All Related" to view available equipment.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("all")}
                className="mt-2 text-xs rounded-xl"
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map((prod) => {
                const imageUrl = prod.images?.[0]?.src || "";
                const name = prod.name || "";
                const category = prod.categories?.[0]?.name || "Medical Device";
                const price =
                  parseFloat(prod.on_sale ? prod.sale_price : prod.price) || 0;
                const originalPrice = prod?.on_sale
                  ? parseFloat(prod.regular_price)
                  : undefined;
                const hasDiscount =
                  typeof originalPrice === "number" && originalPrice > price;
                const discountPercentage = hasDiscount
                  ? Math.round(((originalPrice - price) / originalPrice) * 100)
                  : 0;

                const isAdded = !!addedItems[prod.id];
                const inWish = wishlistHydrated && isInWishlist(prod.id);
                const inComp = compareHydrated && isInCompare(prod.id);

                return (
                  <div
                    key={prod.id}
                    className="group relative flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/40 transition-all duration-300 transform-gpu hover:-translate-y-1"
                  >
                    {/* Image Area */}
                    <div
                      className="relative bg-slate-50/90 dark:bg-slate-900/50 h-44 sm:h-48 w-full p-4 flex items-center justify-center cursor-pointer overflow-hidden border-b border-border/40"
                      onClick={() => handleNavigateToDetails(prod)}
                    >
                      {/* Top Badges */}
                      {hasDiscount && (
                        <div className="absolute left-2.5 top-2.5 z-10">
                          <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold shadow-xs">
                            -{discountPercentage}%
                          </span>
                        </div>
                      )}

                      {/* Action Toolbar (Top Right) */}
                      <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWishlistToggle(prod);
                          }}
                          className={`h-8 w-8 rounded-full shadow-md flex items-center justify-center transition-all duration-200 backdrop-blur-md ${
                            inWish
                              ? "bg-rose-50 text-rose-500 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800"
                              : "bg-white/90 dark:bg-slate-800/90 text-gray-600 dark:text-gray-300 hover:text-rose-500 hover:scale-110"
                          }`}
                          title={inWish ? "Remove from wishlist" : "Add to wishlist"}
                          aria-label={inWish ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <Heart
                            className={`h-4 w-4 ${inWish ? "fill-rose-500" : ""}`}
                          />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompareToggle(prod);
                          }}
                          disabled={!inComp && !canAddMoreCompare()}
                          className={`h-8 w-8 rounded-full shadow-md flex items-center justify-center transition-all duration-200 backdrop-blur-md disabled:opacity-40 ${
                            inComp
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800"
                              : "bg-white/90 dark:bg-slate-800/90 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:scale-110"
                          }`}
                          title={inComp ? "Remove from comparison" : "Add to comparison"}
                          aria-label={inComp ? "Remove from comparison" : "Add to comparison"}
                        >
                          <GitCompare
                            className={`h-4 w-4 ${inComp ? "fill-current" : ""}`}
                          />
                        </button>
                      </div>

                      {/* Product Image */}
                      {imageUrl ? (
                        <Image
                          fill
                          src={imageUrl}
                          alt={name}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                          style={{ objectFit: "contain" }}
                          className="p-3 transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                          <PackageSearch className="h-10 w-10" />
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div
                      className="p-4 flex flex-col flex-1 cursor-pointer"
                      onClick={() => handleNavigateToDetails(prod)}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full truncate">
                          {category}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-semibold leading-snug text-foreground line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors mb-3">
                        {name}
                      </h3>

                      {/* Pricing block */}
                      <div className="mt-auto pt-2 border-t border-border/40 flex flex-col">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-foreground">
                            Ksh. {formatCurrency(price)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-muted-foreground line-through">
                              Ksh. {formatCurrency(originalPrice)}
                            </span>
                          )}
                        </div>
                        {hasDiscount && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            Save Ksh. {formatCurrency(originalPrice - price)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="p-4 pt-0 mt-auto flex flex-col gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(prod);
                        }}
                        size="sm"
                        className={`w-full h-9 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                          isAdded
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                            : "shadow-xs"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-4 w-4" />
                            Added to Cart
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Add to Cart
                          </>
                        )}
                      </Button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateToDetails(prod);
                        }}
                        className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 py-1"
                      >
                        <span>View specifications</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="px-6 sm:px-8 py-4 border-t border-border/60 bg-slate-50/70 dark:bg-slate-900/40 shrink-0 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-xs font-medium rounded-xl"
          >
            Close Window
          </Button>

          <div>
            {compareItems.length > 0 ? (
              <Button
                size="sm"
                onClick={() => {
                  router.push("/compare");
                  onClose();
                }}
                className="text-xs font-semibold rounded-xl gap-2 shadow-sm"
              >
                <GitCompare className="h-3.5 w-3.5" />
                Compare Selected ({compareItems.length})
                <ArrowRight className="h-3 w-3" />
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                Select items to compare side-by-side
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RelatedProductsModal;
