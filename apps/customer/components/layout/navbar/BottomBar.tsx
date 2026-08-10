"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Stethoscope, Home, Banknote, RotateCcw, BadgeCheck, PackageSearch } from "lucide-react"
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
import { Product } from "@/lib/data/types";

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
                          href={`/categories/${category.slug}`}
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
                          href={`/categories/${category.slug}`}
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

              {/* === By Budget === */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Budget</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[500px] p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Banknote className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">Shop by Budget</h3>
                          <p className="text-xs text-muted-foreground">Select a price tier to filter certified medical equipment</p>
                        </div>
                      </div>
                    </div>

                    {/* 2-Column Grid for Budget Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <NavigationMenuLink asChild>
                        <NavigationLink
                          href="/products?min_price=0&max_price=1000"
                          className="group flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-card hover:border-emerald-500/50 hover:shadow-md transition-all duration-200 no-underline outline-none"
                          pendingClassName="opacity-50"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                Under Ksh 1,000
                              </span>
                              <span className="text-xs text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all">→</span>
                            </div>
                            <h4 className="text-xs font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Essentials & Basics</h4>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">Test strips, bandages, masks & diagnostic disposables.</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-medium">
                            Starts from <strong className="text-foreground">Ksh 200</strong>
                          </div>
                        </NavigationLink>
                      </NavigationMenuLink>

                      <NavigationMenuLink asChild>
                        <NavigationLink
                          href="/products?min_price=1000&max_price=5000"
                          className="group flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-card hover:border-blue-500/50 hover:shadow-md transition-all duration-200 no-underline outline-none"
                          pendingClassName="opacity-50"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                                Ksh 1k – 5k
                              </span>
                              <span className="text-xs text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all">→</span>
                            </div>
                            <h4 className="text-xs font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Everyday Health</h4>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">Digital BP monitors, pulse oximeters & thermometers.</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-medium">
                            Starts from <strong className="text-foreground">Ksh 1,200</strong>
                          </div>
                        </NavigationLink>
                      </NavigationMenuLink>

                      <NavigationMenuLink asChild>
                        <NavigationLink
                          href="/products?min_price=5000&max_price=20000"
                          className="group flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-card hover:border-purple-500/50 hover:shadow-md transition-all duration-200 no-underline outline-none"
                          pendingClassName="opacity-50"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                                Ksh 5k – 20k
                              </span>
                              <span className="text-xs text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all">→</span>
                            </div>
                            <h4 className="text-xs font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Clinical & Home Care</h4>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">Compressor nebulizers, wheelchairs & fetal dopplers.</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-medium">
                            Starts from <strong className="text-foreground">Ksh 5,500</strong>
                          </div>
                        </NavigationLink>
                      </NavigationMenuLink>

                      <NavigationMenuLink asChild>
                        <NavigationLink
                          href="/products?min_price=20000"
                          className="group flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-card hover:border-amber-500/50 hover:shadow-md transition-all duration-200 no-underline outline-none"
                          pendingClassName="opacity-50"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                Ksh 20,000+
                              </span>
                              <span className="text-xs text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all">→</span>
                            </div>
                            <h4 className="text-xs font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Advanced Equipment</h4>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">Oxygen concentrators, hospital beds & patient monitors.</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-medium">
                            Starts from <strong className="text-foreground">Ksh 20,000</strong>
                          </div>
                        </NavigationLink>
                      </NavigationMenuLink>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-border flex justify-end text-xs">
                      <NavigationMenuLink asChild>
                        <NavigationLink
                          href="/products"
                          className="font-semibold text-primary hover:underline flex items-center gap-1 no-underline outline-none"
                          pendingClassName="opacity-50"
                        >
                          Browse catalog →
                        </NavigationLink>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </NavigationMenuContent>
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
