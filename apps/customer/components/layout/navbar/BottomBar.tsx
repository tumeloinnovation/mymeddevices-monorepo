"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Stethoscope, Home, Package, RotateCcw, BadgeCheck, PackageSearch } from "lucide-react"
import { formatCurrency } from "@/lib/utils/utils"
import { useRouter } from "next/navigation"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import Image from "next/image";
import { NavigationLink } from "@/components/ui/navigation-link";
import { CategoryListItem } from "./CategoryListItem";
import { ShopFiltersProvider } from "@/lib/context/ShopFiltersContext";
import { useProducts } from "@/lib/hooks/useProducts";
import { useCategories } from "@/lib/hooks/useCategories";
import { useBundles, Bundle } from "@/lib/hooks/useBundles";
import { Product } from "@/lib/data/types";

// Curated List (Bundles) Component
function CuratedListMenu() {
  const { data: bundles = [], isLoading, error } = useBundles();

  // Calculate savings percentage for display
  const getSavingsDisplay = (bundle: Bundle): string | null => {
    if (bundle.discount_amount && bundle.gross_customer_price && Number(bundle.gross_customer_price) > 0) {
      const savingsPercent = Math.round((Number(bundle.discount_amount) / Number(bundle.gross_customer_price)) * 100);
      return savingsPercent > 0 ? `Save ${savingsPercent}%` : null;
    }
    if (bundle.discount_type === 'PERCENTAGE' && bundle.discount_value > 0) {
      return `Save ${Math.round(bundle.discount_value)}%`;
    }
    if (bundle.discount_value > 0) {
      return `Save Ksh ${Number(bundle.discount_value).toLocaleString()}`;
    }
    return null;
  };

  const getItemCount = (bundle: Bundle): string => {
    const count = bundle.components?.reduce((sum, c) => sum + (c.quantity || 1), 0) || bundle.components?.length || 0;
    return count === 1 ? '1 Device' : `${count} Devices`;
  };

  return (
    <>
      <NavigationMenuTrigger className="gap-1.5 font-medium">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Curated Kits
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="w-[580px] p-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-border/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-foreground tracking-tight">Curated Medical Kits</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Package Deals
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Certified device bundles with built-in clinic savings</p>
              </div>
            </div>
            <NavigationMenuLink asChild>
              <NavigationLink
                href="/products?product_type=bundle"
                className="text-xs font-semibold text-primary hover:underline no-underline"
                pendingClassName="opacity-50"
              >
                All Bundles →
              </NavigationLink>
            </NavigationMenuLink>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-full mb-1" />
                  <div className="h-8 bg-muted rounded w-1/2 mt-3" />
                </div>
              ))}
            </div>
          ) : error || bundles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-2xl border border-dashed border-border bg-muted/10">
              <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center mb-2">
                <PackageSearch className="w-5 h-5 text-muted-foreground" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">No Bundles Available</h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                {error ? 'Failed to load bundles. Please try again later.' : 'Check back soon for curated product bundles.'}
              </p>
            </div>
          ) : (
            <>
              {/* 2-Column Grid for Custom Bundle Cards */}
              <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pb-1 pr-1">
                {bundles.slice(0, 6).map((bundle) => {
                  const savingsText = getSavingsDisplay(bundle);
                  const deviceCount = getItemCount(bundle);

                  return (
                    <NavigationMenuLink key={bundle.id} asChild>
                      <NavigationLink
                        href={`/products/${bundle.slug}`}
                        className="group relative flex flex-col justify-between p-3.5 rounded-2xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-300 no-underline outline-none overflow-hidden"
                        pendingClassName="opacity-50"
                      >
                        {/* Background Accent */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />

                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-md">
                              {deviceCount}
                            </span>
                            {savingsText && (
                              <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                {savingsText}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                            {bundle.name}
                          </h4>

                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                            {bundle.description || `Includes complete equipment set and standardized clinical accessories.`}
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-border/60 flex items-baseline justify-between">
                          <span className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors">
                            Ksh {Number(bundle.net_customer_price || bundle.gross_customer_price || 0).toLocaleString()}
                          </span>
                          <span className="text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            View kit →
                          </span>
                        </div>
                      </NavigationLink>
                    </NavigationMenuLink>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-3.5 pt-3 border-t border-border flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{bundles.length} curated package{bundles.length === 1 ? '' : 's'} available</span>
                <NavigationMenuLink asChild>
                  <NavigationLink
                    href="/products?product_type=bundle"
                    className="font-bold text-primary hover:underline flex items-center gap-1 no-underline outline-none"
                    pendingClassName="opacity-50"
                  >
                    Browse all packages →
                  </NavigationLink>
                </NavigationMenuLink>
              </div>
            </>
          )}
        </div>
      </NavigationMenuContent>
    </>
  );
}

export function BottomBar() {
  const router = useRouter();
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const scrollBy = (distance: number) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: distance, behavior: "smooth" })
  }

  // Fetch categories
  const { data: categories = [] } = useCategories();

  // Fetch featured products
  const featuredProducts = useProducts({ featured: true, per_page: 10 });

  // Fetch new arrivals
  const newArrivalProducts = useProducts({ orderby: 'date', per_page: 10 });

  // Seeded intent-based categories with context
  const byConditionCategories = [
    { name: 'Diabetes Care', slug: 'diabetic-care', description: 'Glucose monitors, test strips, lancets', context: 'Daily blood sugar management' },
    { name: 'Hypertension', slug: 'bp-monitors', description: 'BP monitors, cuffs, accessories', context: 'Regular blood pressure tracking' },
    { name: 'Mobility Aids', slug: 'mobility-rehabilitation-aids', description: 'Wheelchairs, walkers, canes', context: 'Support for independent movement' },
    { name: 'Respiratory Care', slug: 'respiratory', description: 'Nebulizers, oxygen equipment', context: 'Breathing support solutions' },
    { name: 'Elderly Care', slug: 'elderly-care', description: 'Daily living aids, safety equipment', context: 'Comfort and dignity at home' },
    { name: 'First Aid', slug: 'first-aid', description: 'Bandages, antiseptics, emergency kits', context: 'Emergency preparedness' },
  ];

  const byCareSettingCategories = [
    { name: 'Home Care', slug: 'home-care', description: 'Equipment for home healthcare', context: 'Professional care at home' },
    { name: 'Hospital Equipment', slug: 'hospital-equipment', description: 'Professional medical devices', context: 'Clinical-grade reliability' },
    { name: 'Clinic Supplies', slug: 'clinic-supplies', description: 'Examination room essentials', context: 'Daily practice needs' },
    { name: 'Personal Care', slug: 'personal-care', description: 'Personal health and wellness', context: 'Self-care made easy' },
  ];

  // Enhanced product card with better presentation
  const renderProductCard = (product: Product) => {
    const discountPercent = product.on_sale && product.regular_price
      ? Math.round((1 - parseFloat(product.price) / parseFloat(product.regular_price)) * 100)
      : 0;

    return (
      <div
        key={product.id}
        onClick={() => router.push(`/products/${product.slug}`)}
        className="group relative flex-shrink-0 w-44 bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer"
      >
        {/* Image Section */}
        <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted/30 p-3">
          <Image
            src={product.images?.[0]?.src || '/logos/logo-portrait.png'}
            alt={product.name}
            width={160}
            height={160}
            className="w-full h-full object-contain mix-blend-multiply"
          />
          {product.on_sale && discountPercent > 0 && (
            <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
              -{discountPercent}%
            </span>
          )}
          {product.featured && (
            <span className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Info Section */}
        <div className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
            {product.categories?.[0]?.name || 'Medical Supplies'}
          </p>
          <h3 className="text-sm font-semibold text-card-foreground line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Price & Rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-primary">
                {formatCurrency(parseFloat(product.price))}
              </span>
              {product.on_sale && product.regular_price && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(parseFloat(product.regular_price))}
                </span>
              )}
            </div>
            {product.average_rating && (
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-medium text-amber-600">
                  ★ {parseFloat(product.average_rating).toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full border-b">
      <div className="container mx-auto px-4 h-14 flex items-center">
        <ShopFiltersProvider>
          <NavigationMenu>
            <NavigationMenuList>
              {/* === By Condition === */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>By Condition</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[480px] grid-cols-2 gap-3.5 p-4 md:w-[600px] lg:w-[700px]">
                    <div className="col-span-2 border-b border-border pb-3 mb-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">Shop by Condition</h3>
                      <p className="text-sm text-muted-foreground">Find products tailored to your specific health needs</p>
                    </div>
                    {byConditionCategories.map((category) => (
                      <NavigationMenuLink key={category.slug} asChild>
                        <NavigationLink
                          href={`/products?category=${category.slug}`}
                          className="group flex flex-col rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all no-underline outline-none"
                          pendingClassName="opacity-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                                {category.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mb-2">{category.description}</p>
                              <p className="text-[10px] text-primary/80 italic">{category.context}</p>
                            </div>
                            <span className="text-muted-foreground group-hover:text-primary transition-colors">→</span>
                          </div>
                        </NavigationLink>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* === By Care Setting === */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Care Setting</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[400px] grid-cols-2 gap-3.5 p-4 md:w-[500px] lg:w-[600px]">
                    <div className="col-span-2 border-b border-border pb-3 mb-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">Shop by Care Setting</h3>
                      <p className="text-sm text-muted-foreground">Equipment for home care, clinics, hospitals, and personal use</p>
                    </div>
                    {byCareSettingCategories.map((category) => (
                      <NavigationMenuLink key={category.slug} asChild>
                        <NavigationLink
                          href={`/products?category=${category.slug}`}
                          className="group flex flex-col rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all no-underline outline-none"
                          pendingClassName="opacity-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                                {category.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mb-2">{category.description}</p>
                              <p className="text-[10px] text-primary/80 italic">{category.context}</p>
                            </div>
                            <span className="text-muted-foreground group-hover:text-primary transition-colors">→</span>
                          </div>
                        </NavigationLink>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* === Curated List (Bundles) === */}
              <NavigationMenuItem>
                <CuratedListMenu />
              </NavigationMenuItem>

              {/* === Clinician's Picks === */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Clinician's Picks</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[750px] p-4 md:w-[850px]">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">Clinician's Picks</h3>
                        <p className="text-sm text-muted-foreground">Hand-selected by our medical team for reliability and quality</p>
                      </div>
                      <NavigationMenuLink asChild>
                        <NavigationLink
                          href="/products?featured=true"
                          className="text-xs font-medium text-primary hover:underline no-underline outline-none"
                          pendingClassName="opacity-50"
                        >
                          See all →
                        </NavigationLink>
                      </NavigationMenuLink>
                    </div>

                    {featuredProducts.isLoading ? (
                      <div className="flex gap-3 pb-2 overflow-x-auto hide-scrollbar">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex-shrink-0 w-44 h-48 bg-muted/20 animate-pulse rounded-xl border border-border" />
                        ))}
                      </div>
                    ) : !featuredProducts.products || featuredProducts.products.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-xl border border-dashed border-border bg-muted/10">
                        <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center mb-2">
                          <PackageSearch className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground mb-1">No Clinician's Picks</h4>
                        <p className="text-xs text-muted-foreground max-w-sm">No curated products available in this section currently.</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          type="button"
                          aria-label="Scroll left"
                          onClick={() => scrollBy(-190)}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border shadow-sm hover:bg-accent transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        <button
                          type="button"
                          aria-label="Scroll right"
                          onClick={() => scrollBy(190)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border shadow-sm hover:bg-accent transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>

                        <div ref={scrollRef} className="overflow-x-auto hide-scrollbar">
                          <div className="flex gap-3 pb-2">
                            {featuredProducts.products.slice(0, 6).map(renderProductCard)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* === What's New === */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>What's New</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[750px] p-4 md:w-[850px]">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">What's New</h3>
                        <p className="text-sm text-muted-foreground">Explore the latest medical technology and equipment</p>
                      </div>
                      <NavigationMenuLink asChild>
                        <NavigationLink
                          href="/products?orderby=date"
                          className="text-xs font-medium text-primary hover:underline no-underline outline-none"
                          pendingClassName="opacity-50"
                        >
                          See all →
                        </NavigationLink>
                      </NavigationMenuLink>
                    </div>

                    {newArrivalProducts.isLoading ? (
                      <div className="flex gap-3 pb-2 overflow-x-auto hide-scrollbar">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex-shrink-0 w-44 h-48 bg-muted/20 animate-pulse rounded-xl border border-border" />
                        ))}
                      </div>
                    ) : !newArrivalProducts.products || newArrivalProducts.products.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-xl border border-dashed border-border bg-muted/10">
                        <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center mb-2">
                          <PackageSearch className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground mb-1">No New Arrivals</h4>
                        <p className="text-xs text-muted-foreground max-w-sm">No new products have been added recently. Check back soon!</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          type="button"
                          aria-label="Scroll left"
                          onClick={() => scrollBy(-190)}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border shadow-sm hover:bg-accent transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        <button
                          type="button"
                          aria-label="Scroll right"
                          onClick={() => scrollBy(190)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border shadow-sm hover:bg-accent transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>

                        <div ref={scrollRef} className="overflow-x-auto hide-scrollbar">
                          <div className="flex gap-3 pb-2">
                            {newArrivalProducts.products.slice(0, 6).map(renderProductCard)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* === Shop All === */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <NavigationLink className={navigationMenuTriggerStyle()} href="/products" pendingClassName="opacity-50">
                    Shop All
                  </NavigationLink>
                </NavigationMenuLink>
              </NavigationMenuItem>

            </NavigationMenuList>
          </NavigationMenu>
        </ShopFiltersProvider>
      </div>
    </div>
  )
}
