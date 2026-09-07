"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getValidImageUrl } from "@/lib/utils/image";
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Search, 
  Grid, 
  List, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Share2, 
  ShieldCheck, 
  Package, 
  SlidersHorizontal,
  ArrowUpDown,
  Zap,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import useCartStore from "@/lib/store/useCartStore";
import { formatCurrency } from "@/lib/utils/utils";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/app/(shop)/products/_components/ProductCard";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const clear = useWishlistStore((s) => s.clear);
  const addToCart = useCartStore((s) => s.addItem);
  const isInCart = useCartStore((s) => s.isInCart);

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "price-asc" | "price-desc" | "name">("recent");
  const [copiedLink, setCopiedLink] = useState(false);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item: any) =>
          item.name?.toLowerCase().includes(q) ||
          item.category?.name?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q) ||
          item.brand?.toLowerCase().includes(q)
      );
    }

    if (sortBy === "price-asc") {
      result.sort((a: any, b: any) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "price-desc") {
      result.sort((a: any, b: any) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === "name") {
      result.sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
    }

    return result;
  }, [items, searchQuery, sortBy]);

  const totalValue = useMemo(() => {
    return items.reduce((acc: number, item: any) => acc + (Number(item.price) || 0), 0);
  }, [items]);

  const handleAddAllToCart = () => {
    items.forEach((p: any) => addToCart(p, 1));
  };

  const handleShareWishlist = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}

      <div className="rounded-2xl border bg-card text-card-foreground p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              <Sparkles className="w-4 h-4" /> Medical Procurement Saved Items
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                Saved Wishlist
                <Badge variant="secondary" className="px-2.5 py-0.5 text-sm font-medium rounded-full">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </Badge>
              </h1>

              {items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShareWishlist}
                  title="Share Wishlist"
                  className="text-muted-foreground hover:text-foreground gap-1.5 px-2.5 h-8 rounded-lg text-xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Copied Link" : "Share"}</span>
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Keep track of certified medical equipment, compare specifications, or batch order for your healthcare facility.
            </p>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-3 bg-card dark:bg-slate-800/80 p-2 pl-4 rounded-2xl border shadow-sm ring-1 ring-border/50">
              {/* Total Saved Value Column */}
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Saved Value</span>
                <span className="text-base font-extrabold text-primary flex items-center gap-1">
                  Ksh {formatCurrency(totalValue)}
                </span>
              </div>

              <div className="h-8 w-px bg-border/80 mx-1" />

              {/* Action Button */}
              <Button 
                onClick={handleAddAllToCart} 
                className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add All to Cart</span>
              </Button>
            </div>
          )}
        </div>
      </div>



      <div>
        {items.length === 0 ? (
          /* Empty State */
          <Card className="max-w-xl mx-auto p-8 sm:p-12 text-center border-dashed border-2 shadow-xs rounded-2xl bg-card">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-5 ring-8 ring-primary/5">
              <Heart className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Your Wishlist is Empty</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Save essential medical equipment, surgical tools, or clinical consumables here to quickly order or request quotes later.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/products" className="w-full sm:w-auto">
                <Button className="w-full gap-2">
                  <Package className="w-4 h-4" />
                  Explore Catalog
                </Button>
              </Link>
              <Link href="/categories" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full gap-2">
                  Browse Categories
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          /* Wishlist Content */
          <div className="space-y-6">
            {/* Toolbar / Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search saved equipment, SKU, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-muted/30 border"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground hidden sm:inline-block" />
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="h-10 text-xs sm:text-sm bg-muted/30 border rounded-lg px-3 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>

                <div className="flex items-center border rounded-lg p-1 bg-muted/30">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                      viewMode === "grid"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                      viewMode === "table"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Compact Spec Table"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clear()}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </Button>
              </div>
            </div>

            {/* List / Grid Display */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border">
                <p className="text-sm text-muted-foreground">No items match your current search criteria.</p>
                <Button variant="link" onClick={() => setSearchQuery("")} className="text-primary mt-2">
                  Clear search filter
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence>
                  {filteredItems.map((product: any) => (
                    <motion.div
                      key={product.id ?? product.slug ?? product.sku}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ProductCard
                        product={product}
                        externalAdded={isInCart(product.id ?? product.slug ?? product.sku)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              /* Compact Specs Table View */
              <div className="bg-card rounded-xl border overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-foreground">
                    <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                      <tr>
                        <th className="px-6 py-4">Product Details</th>
                        <th className="px-4 py-4">Regulatory & Stock</th>
                        <th className="px-4 py-4">Unit Price</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <AnimatePresence>
                        {filteredItems.map((item: any) => {
                          const id = item.id ?? item.slug ?? item.sku;
                          const name = item.name ?? "Medical Product";
                          const rawImage = item.image ?? (Array.isArray(item.images) ? (item.images[0]?.src ?? item.images[0]?.url ?? item.images[0]) : item.image_url);
                          const image = getValidImageUrl(rawImage, "/logos/logo-portrait.png");
                          const price = Number(item.price ?? item.regular_price ?? 0);
                          const inCart = isInCart(id);

                          return (
                            <motion.tr 
                              key={id} 
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="hover:bg-muted/20 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                                    <Image
                                      src={image}
                                      alt={name}
                                      fill
                                      className="object-cover"
                                      sizes="64px"
                                    />
                                  </div>
                                  <div>
                                    <Link 
                                      href={`/products/${item.slug || id}`} 
                                      className="font-medium text-foreground hover:text-primary line-clamp-1"
                                    >
                                      {name}
                                    </Link>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                      {item.sku && <span>SKU: {item.sku}</span>}
                                      {item.category?.name && (
                                        <>
                                          <span>•</span>
                                          <span className="text-primary">{item.category.name}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <div className="space-y-1.5">
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 text-[10px] gap-1">
                                    <ShieldCheck className="w-3 h-3" /> PPB / KMPDB Certified
                                  </Badge>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    In Stock (Central Warehouse)
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="font-semibold text-foreground">
                                  Ksh {formatCurrency(price)}
                                </div>
                                {item.regular_price && Number(item.regular_price) > price && (
                                  <div className="text-xs text-muted-foreground line-through">
                                    Ksh {formatCurrency(item.regular_price)}
                                  </div>
                                )}
                              </td>

                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => addToCart(item, 1)}
                                    variant={inCart ? "secondary" : "default"}
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-1.5" />
                                    {inCart ? "In Cart" : "Add to Cart"}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => removeItem(id)}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    title="Remove item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bottom summary footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-primary flex-shrink-0" />
                <span>
                  Wishlist items are synchronized with your account in the database so you can seamlessly access them across all your devices.
                </span>
              </div>
              <div className="flex items-center gap-4 font-medium whitespace-nowrap">
                <span>Showing {filteredItems.length} of {items.length} saved products</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}


