'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Trash2,
  ShoppingCart,
  Heart,
  Search,
  Grid,
  List as ListIcon,
  Package,
  ArrowRight,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
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
import { useRecentlyViewedStore } from '@/lib/store/useRecentlyViewedStore';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import useCartStore from '@/lib/store/useCartStore';
import { formatCurrency } from '@/lib/utils/utils';
import { getValidImageUrl } from '@/lib/utils/image';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RecentlyViewedPage() {
  const { items, clearItems } = useRecentlyViewedStore();
  const [mounted, setMounted] = useState(false);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'sale'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'name'>('recent');

  const addToCart = useCartStore((state) => state.addItem);
  const isInCart = useCartStore((state) => state.isInCart);
  const addToWishlist = useWishlistStore((state) => state.addItem);
  const removeFromWishlist = useWishlistStore((state) => state.removeItem);
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let list = [...items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q) ||
          (item as any)?.category?.toLowerCase().includes(q)
      );
    }

    if (stockFilter === 'in_stock') {
      list = list.filter((item) => item.stock_status === 'instock' || item.stock_status === undefined);
    } else if (stockFilter === 'sale') {
      list = list.filter((item) => {
        const p = parseFloat(item.price || '0');
        const reg = parseFloat(item.regular_price || '0');
        return !isNaN(p) && !isNaN(reg) && reg > p;
      });
    }

    list.sort((a, b) => {
      const priceA = parseFloat(a.price || a.regular_price || '0');
      const priceB = parseFloat(b.price || b.regular_price || '0');

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

    return list;
  }, [items, searchQuery, stockFilter, sortBy]);

  const handleAddToCart = (item: any) => {
    addToCart(item, 1);
    toast.success(`${item.name} added to cart!`);
  };

  const handleWishlistToggle = (item: any) => {
    if (isInWishlist(item.id)) {
      removeFromWishlist(item.id);
    } else {
      addToWishlist(item);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-36 rounded-2xl bg-muted/40 animate-pulse border border-border/70" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted/30 animate-pulse border border-border/60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Hero Banner */}
      <Card className="border border-border/80 shadow-xs overflow-hidden rounded-2xl bg-card">
        <div className="p-6 md:p-8 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Clock className="h-3.5 w-3.5" />
                <span>Session Browsing Memory</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Recently Viewed Products
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Quickly revisit certified medical devices, diagnostics, and surgical equipment you inspected across your recent shopping sessions.
              </p>
            </div>

            {/* Clear History Button */}
            {items.length > 0 && (
              <div className="flex items-center gap-2.5 self-start md:self-auto">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-xl text-xs font-semibold border-border bg-card hover:bg-muted text-muted-foreground hover:text-destructive shadow-2xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Clear Browsing History</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear your browsing history?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear all {items.length} recently viewed items from your current session cache.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          clearItems();
                          toast.success('Browsing history cleared');
                        }}
                        className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        Clear History
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Toolbar (Search, Filter, View Mode) */}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-2xl border border-border/80 shadow-2xs">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search recently viewed items..."
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
                All ({items.length})
              </button>
              <button
                onClick={() => setStockFilter('in_stock')}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                  stockFilter === 'in_stock' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                In Stock
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
                <SelectItem value="recent">Recently Viewed</SelectItem>
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

      {/* 3. Products List or Empty State */}
      {items.length === 0 ? (
        <Card className="border border-border/80 rounded-2xl p-12 text-center bg-card shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-xs">
            <Eye className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Recently Viewed Products</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1.5 mb-6 leading-relaxed">
            As you explore our certified medical equipment and consumables catalog, your recently inspected items will automatically appear here for rapid access and price comparisons.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild size="sm" className="rounded-xl font-semibold gap-1.5">
              <Link href="/products">
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Browse Medical Catalog</span>
              </Link>
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t border-border/60 max-w-lg mx-auto">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Explore Featured Product Lines
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { name: 'Patient Monitors', href: '/products?search=monitor' },
                { name: 'ECG & Diagnostics', href: '/products?search=ecg' },
                { name: 'Ultrasound Units', href: '/products?search=ultrasound' },
                { name: 'Infusion Pumps', href: '/products?search=pump' },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="px-3 py-1.5 rounded-xl border border-border/70 bg-muted/30 hover:bg-primary/10 hover:border-primary/30 text-xs font-medium text-foreground transition-all"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="border border-border/80 rounded-2xl p-12 text-center bg-card shadow-xs">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h4 className="text-sm font-bold text-foreground">No matching products found</h4>
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
            {filteredItems.map((product) => {
              const rawImage =
                product?.images && Array.isArray(product.images)
                  ? product.images[0]?.src || (product.images[0] as any)?.url || (product.images[0] as any)
                  : (product as any)?.image_url || (product as any)?.image;
              const imageUrl = getValidImageUrl(rawImage, '/logos/logo-portrait.png');
              const price = parseFloat(product.price || product.regular_price || '0');
              const regularPrice = product.regular_price ? parseFloat(product.regular_price) : undefined;
              const hasDiscount = regularPrice && regularPrice > price;
              const discountPercent = hasDiscount ? Math.round(((regularPrice - price) / regularPrice) * 100) : 0;
              const isAvailable = product.stock_status === 'instock' || product.stock_status === undefined;
              const inWishlist = isInWishlist(product.id);
              const inCart = isInCart(product.id);

              return (
                <motion.div
                  key={product.id || product.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card className="group rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col h-full">
                    {/* Image Area */}
                    <div className="relative h-48 bg-muted/25 border-b border-border/60 flex items-center justify-center overflow-hidden">
                      <Link href={`/products/${product.slug || product.id}`} className="w-full h-full relative">
                        <Image
                          src={imageUrl}
                          alt={product.name || 'Medical Product'}
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

                      {/* Wishlist Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleWishlistToggle(product)}
                        className={cn(
                          'absolute top-3 right-3 h-8 w-8 rounded-full backdrop-blur-md transition-all shadow-2xs z-10',
                          inWishlist
                            ? 'bg-red-500/15 text-red-500 hover:bg-red-500/25'
                            : 'bg-background/80 hover:bg-background text-muted-foreground hover:text-red-500'
                        )}
                        title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                      >
                        <Heart className={cn('h-3.5 w-3.5', inWishlist && 'fill-current')} />
                      </Button>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground line-clamp-1">
                          {(product as any)?.category || (product as any)?.brand || 'Medical Product'}
                        </span>
                        <Link
                          href={`/products/${product.slug || product.id}`}
                          className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors line-clamp-2 leading-tight"
                        >
                          {product.name}
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

                        {product.sku && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            SKU: {String(product.sku).slice(0, 8)}
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={!isAvailable}
                        variant={inCart ? 'outline' : 'default'}
                        className={cn(
                          'w-full rounded-xl text-xs font-semibold gap-1.5 shadow-2xs',
                          inCart ? 'border-primary text-primary hover:bg-primary/10' : ''
                        )}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>{inCart ? 'Add Another' : 'Add to Cart'}</span>
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
            {filteredItems.map((product) => {
              const rawImage =
                product?.images && Array.isArray(product.images)
                  ? product.images[0]?.src || (product.images[0] as any)?.url || (product.images[0] as any)
                  : (product as any)?.image_url || (product as any)?.image;
              const imageUrl = getValidImageUrl(rawImage, '/logos/logo-portrait.png');
              const price = parseFloat(product.price || product.regular_price || '0');
              const regularPrice = product.regular_price ? parseFloat(product.regular_price) : undefined;
              const hasDiscount = regularPrice && regularPrice > price;
              const isAvailable = product.stock_status === 'instock' || product.stock_status === undefined;
              const inWishlist = isInWishlist(product.id);
              const inCart = isInCart(product.id);

              return (
                <div
                  key={product.id || product.slug}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/15 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Link
                      href={`/products/${product.slug || product.id}`}
                      className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-muted/40 border border-border/60 overflow-hidden shrink-0 flex items-center justify-center"
                    >
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain p-2"
                        sizes="80px"
                      />
                    </Link>

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
                        {product.sku && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            SKU: {product.sku}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/products/${product.slug || product.id}`}
                        className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors line-clamp-1 block"
                      >
                        {product.name}
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

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleWishlistToggle(product)}
                      className={cn(
                        'h-9 w-9 rounded-xl transition-colors',
                        inWishlist
                          ? 'text-red-500 bg-red-500/10'
                          : 'text-muted-foreground hover:text-red-500 hover:bg-muted/40'
                      )}
                      title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                    >
                      <Heart className={cn('h-4 w-4', inWishlist && 'fill-current')} />
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      disabled={!isAvailable}
                      variant={inCart ? 'outline' : 'default'}
                      className={cn(
                        'rounded-xl text-xs font-semibold gap-1.5 shadow-2xs',
                        inCart ? 'border-primary text-primary hover:bg-primary/10' : ''
                      )}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>{inCart ? 'Add More' : 'Add to Cart'}</span>
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

