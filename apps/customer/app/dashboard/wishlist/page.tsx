'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Share2,
  Search,
  Grid,
  List as ListIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Package,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import useCartStore from '@/lib/store/useCartStore';
import { formatCurrency } from '@/lib/utils/utils';
import { getValidImageUrl } from '@/lib/utils/image';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function WishlistPage() {
  const wishlistItems = useWishlistStore((state) => state.items);
  const removeFromWishlist = useWishlistStore((state) => state.removeItem);
  const clearWishlist = useWishlistStore((state) => state.clear);

  const addToCart = useCartStore((state) => state.addItem);
  const isInCart = useCartStore((state) => state.isInCart);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'sale'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'name'>('recent');
  const [addingAll, setAddingAll] = useState(false);

  // Computed metrics
  const totalValue = useMemo(() => {
    return wishlistItems.reduce((acc, item) => {
      const price = parseFloat(item.price || item.regular_price || '0');
      return acc + (isNaN(price) ? 0 : price);
    }, 0);
  }, [wishlistItems]);

  const inStockCount = useMemo(() => {
    return wishlistItems.filter((item) => item.stock_status === 'instock' || item.stock_status === undefined).length;
  }, [wishlistItems]);

  const outOfStockCount = wishlistItems.length - inStockCount;

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let list = [...wishlistItems];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q) ||
          (item as any)?.category?.toLowerCase().includes(q)
      );
    }

    // Stock & Sale filter
    if (stockFilter === 'in_stock') {
      list = list.filter((item) => item.stock_status === 'instock' || item.stock_status === undefined);
    } else if (stockFilter === 'sale') {
      list = list.filter((item) => {
        const p = parseFloat(item.price || '0');
        const reg = parseFloat(item.regular_price || '0');
        return !isNaN(p) && !isNaN(reg) && reg > p;
      });
    }

    // Sort order
    list.sort((a, b) => {
      const priceA = parseFloat(a.price || a.regular_price || '0');
      const priceB = parseFloat(b.price || b.regular_price || '0');

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0; // default order (recently added)
    });

    return list;
  }, [wishlistItems, searchQuery, stockFilter, sortBy]);

  const handleAddToCart = (item: any) => {
    addToCart(item as any, 1);
    toast.success(`${item.name} added to cart!`);
  };

  const handleAddAllInStock = () => {
    const available = wishlistItems.filter((item) => item.stock_status === 'instock' || item.stock_status === undefined);
    if (available.length === 0) {
      toast.error('No items currently in stock to add.');
      return;
    }

    setAddingAll(true);
    available.forEach((item) => {
      addToCart(item as any, 1);
    });
    setTimeout(() => {
      setAddingAll(false);
      toast.success(`Added ${available.length} items to your shopping cart!`);
    }, 400);
  };

  const handleShareWishlist = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Wishlist link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Summary Hero Banner */}
      <Card className="border border-border/80 shadow-xs overflow-hidden rounded-2xl bg-card">
        <div className="p-6 md:p-8 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">
                <Heart className="h-3.5 w-3.5 fill-current" />
                <span>Saved Equipment & Clinical Supplies</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                My Medical Wishlist
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Keep track of certified medical devices, consumables, and diagnostics. Move in-stock items directly to your procurement cart.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareWishlist}
                className="gap-2 rounded-xl text-xs font-semibold border-border bg-card hover:bg-muted shadow-2xs"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </Button>

              {wishlistItems.length > 0 && (
                <>
                  <Button
                    size="sm"
                    onClick={handleAddAllInStock}
                    disabled={addingAll || inStockCount === 0}
                    className="gap-2 rounded-xl text-xs font-semibold shadow-xs"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Add Available ({inStockCount}) to Cart</span>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Clear All</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear your entire wishlist?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove all {wishlistItems.length} saved medical products from your list. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={clearWishlist}
                          className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Clear Wishlist
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {wishlistItems.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/60">
              <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Saved</span>
                <p className="text-lg font-extrabold text-foreground mt-0.5">{wishlistItems.length} items</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estimated Value</span>
                <p className="text-lg font-extrabold text-primary mt-0.5">Ksh {formatCurrency(totalValue)}</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ready to Dispatch</span>
                <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{inStockCount} In Stock</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Out of Stock</span>
                <p className="text-lg font-extrabold text-muted-foreground mt-0.5">{outOfStockCount} Backordered</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 2. Controls, Search, and Filtering Toolbar */}
      {wishlistItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-2xl border border-border/80 shadow-2xs">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search saved equipment or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-xs rounded-xl bg-background border-border/70"
            />
          </div>

          {/* Filters & View Switches */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Tabs */}
            <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border/60">
              <button
                onClick={() => setStockFilter('all')}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                  stockFilter === 'all' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All ({wishlistItems.length})
              </button>
              <button
                onClick={() => setStockFilter('in_stock')}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                  stockFilter === 'in_stock' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                In Stock ({inStockCount})
              </button>
              <button
                onClick={() => setStockFilter('sale')}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                  stockFilter === 'sale' ? 'bg-card text-red-600 dark:text-red-400 shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                On Sale
              </button>
            </div>

            {/* Sort Select */}
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-9 w-[160px] text-xs rounded-xl bg-background border-border/70">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs">
                <SelectItem value="recent">Recently Added</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="name">Product Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border/60">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'h-7 w-7 rounded-lg transition-all',
                  viewMode === 'grid' ? 'bg-card text-primary shadow-2xs' : 'text-muted-foreground'
                )}
                title="Grid View"
              >
                <Grid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={cn(
                  'h-7 w-7 rounded-lg transition-all',
                  viewMode === 'list' ? 'bg-card text-primary shadow-2xs' : 'text-muted-foreground'
                )}
                title="List View"
              >
                <ListIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Items View (Grid or List) or Empty State */}
      {wishlistItems.length === 0 ? (
        /* Empty State */
        <Card className="border border-border/80 rounded-2xl p-12 text-center bg-card shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-xs">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Your Wishlist is Empty</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1.5 mb-6 leading-relaxed">
            You haven't saved any medical supplies or equipment yet. Explore our verified medical catalog and click the heart icon on any device to save it for later procurement.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild size="sm" className="rounded-xl font-semibold gap-1.5">
              <Link href="/products">
                <Package className="h-3.5 w-3.5" />
                <span>Explore Medical Catalog</span>
              </Link>
            </Button>
          </div>

          {/* Quick Category Badges */}
          <div className="mt-8 pt-8 border-t border-border/60 max-w-lg mx-auto">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Browse Popular Medical Categories
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { name: 'Diagnostic Equipment', href: '/products?category=diagnostics' },
                { name: 'Hospital Furniture', href: '/products?category=furniture' },
                { name: 'PPE & Infection Control', href: '/products?category=ppe' },
                { name: 'Surgical Instruments', href: '/products?category=surgical' },
              ].map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="px-3 py-1.5 rounded-xl border border-border/70 bg-muted/30 hover:bg-primary/10 hover:border-primary/30 text-xs font-medium text-foreground transition-all"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="border border-border/80 rounded-2xl p-12 text-center bg-card shadow-xs">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h4 className="text-sm font-bold text-foreground">No matching items found</h4>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Try adjusting your search query or filters.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs font-semibold"
            onClick={() => {
              setSearchQuery('');
              setStockFilter('all');
            }}
          >
            Reset Filters
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredItems.map((item) => {
              const rawImage =
                item?.images && Array.isArray(item.images)
                  ? item.images[0]?.src || (item.images[0] as any)?.url || (item.images[0] as any)
                  : (item as any)?.image_url || (item as any)?.image;
              const imageUrl = getValidImageUrl(rawImage, '/logos/logo-portrait.png');
              const price = parseFloat(item.price || item.regular_price || '0');
              const regularPrice = item.regular_price ? parseFloat(item.regular_price) : undefined;
              const hasDiscount = regularPrice && regularPrice > price;
              const discountPercent = hasDiscount ? Math.round(((regularPrice - price) / regularPrice) * 100) : 0;
              const isAvailable = item.stock_status === 'instock' || item.stock_status === undefined;
              const itemInCart = isInCart(item.id);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card className="group rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col h-full">
                    {/* Image Area */}
                    <div className="relative h-48 bg-muted/25 border-b border-border/60 flex items-center justify-center overflow-hidden">
                      <Link href={`/products/${item.slug || item.id}`} className="w-full h-full relative">
                        <Image
                          src={imageUrl}
                          alt={item.name || 'Medical Device'}
                          fill
                          className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 300px"
                        />
                      </Link>

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                        {hasDiscount && (
                          <Badge className="bg-red-500 hover:bg-red-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                            -{discountPercent}% OFF
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md border',
                            isAvailable
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30'
                          )}
                        >
                          {isAvailable ? 'In Stock' : 'Backorder'}
                        </Badge>
                      </div>

                      {/* Remove from Wishlist Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromWishlist(item.id)}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 hover:bg-destructive/15 text-muted-foreground hover:text-destructive backdrop-blur-md transition-all shadow-2xs z-10"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground line-clamp-1">
                          {(item as any)?.category || (item as any)?.brand || 'Medical Procurement'}
                        </span>
                        <Link
                          href={`/products/${item.slug || item.id}`}
                          className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors line-clamp-2 leading-tight"
                        >
                          {item.name}
                        </Link>
                      </div>

                      {/* Price Section */}
                      <div className="pt-2 border-t border-border/50 flex items-baseline justify-between gap-2">
                        <div>
                          <p className="text-sm sm:text-base font-extrabold text-foreground">
                            Ksh {formatCurrency(price)}
                          </p>
                          {hasDiscount && (
                            <p className="text-[11px] text-muted-foreground line-through">
                              Ksh {formatCurrency(regularPrice!)}
                            </p>
                          )}
                        </div>

                        {item.sku && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            SKU: {String(item.sku).slice(0, 8)}
                          </span>
                        )}
                      </div>

                      {/* Cart Action Button */}
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                        disabled={!isAvailable}
                        variant={itemInCart ? 'outline' : 'default'}
                        className={cn(
                          'w-full rounded-xl text-xs font-semibold gap-1.5 shadow-2xs',
                          itemInCart ? 'border-primary text-primary hover:bg-primary/10' : ''
                        )}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>{itemInCart ? 'Add Another' : 'Add to Cart'}</span>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* LIST VIEW */
        <Card className="border border-border/80 rounded-2xl bg-card overflow-hidden shadow-2xs">
          <div className="divide-y divide-border/60">
            {filteredItems.map((item) => {
              const rawImage =
                item?.images && Array.isArray(item.images)
                  ? item.images[0]?.src || (item.images[0] as any)?.url || (item.images[0] as any)
                  : (item as any)?.image_url || (item as any)?.image;
              const imageUrl = getValidImageUrl(rawImage, '/logos/logo-portrait.png');
              const price = parseFloat(item.price || item.regular_price || '0');
              const regularPrice = item.regular_price ? parseFloat(item.regular_price) : undefined;
              const hasDiscount = regularPrice && regularPrice > price;
              const isAvailable = item.stock_status === 'instock' || item.stock_status === undefined;
              const itemInCart = isInCart(item.id);

              return (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/15 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Thumbnail */}
                    <Link
                      href={`/products/${item.slug || item.id}`}
                      className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-muted/40 border border-border/60 overflow-hidden shrink-0 flex items-center justify-center"
                    >
                      <Image
                        src={imageUrl}
                        alt={item.name}
                        fill
                        className="object-contain p-2"
                        sizes="80px"
                      />
                    </Link>

                    {/* Details */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-bold px-2 py-0 rounded-full border',
                            isAvailable
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                          )}
                        >
                          {isAvailable ? 'In Stock' : 'Backordered'}
                        </Badge>
                        {item.sku && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            SKU: {item.sku}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/products/${item.slug || item.id}`}
                        className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors line-clamp-1 block"
                      >
                        {item.name}
                      </Link>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-extrabold text-foreground">
                          Ksh {formatCurrency(price)}
                        </span>
                        {hasDiscount && (
                          <span className="text-muted-foreground line-through text-[11px]">
                            Ksh {formatCurrency(regularPrice!)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                      disabled={!isAvailable}
                      variant={itemInCart ? 'outline' : 'default'}
                      className={cn(
                        'rounded-xl text-xs font-semibold gap-1.5 shadow-2xs',
                        itemInCart ? 'border-primary text-primary hover:bg-primary/10' : ''
                      )}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>{itemInCart ? 'Add More' : 'Add to Cart'}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromWishlist(item.id)}
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
