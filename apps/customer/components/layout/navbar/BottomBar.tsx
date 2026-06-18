"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
  const newArrivalProducts = useProducts({ orderby: 'date', order: 'desc', per_page: 10 });

  const renderProductCards = (products: Product[]) => {
    return (
      Array.isArray(products) ? products.slice(0, 5).map((product) => (
        <div key={product.id} onClick={() => router.push(`/products/${product.slug}`)} className="flex-shrink-0 w-48 bg-card rounded-lg border border-border shadow-sm overflow-hidden transform transition-transform duration-200 hover:scale-[1.02] hover:shadow-md cursor-pointer">
          <div className="flex h-full flex-col">
            <div className="p-4 flex items-center justify-center h-28 bg-muted/50">
              <Image
                src={product.images?.[0]?.src || '/images/placeholder.png'}
                alt={product.name}
                width={100}
                height={100}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="p-3 border-t border-border bg-card flex-1 flex flex-col justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {product.categories?.[0]?.name || 'Category'}
                </div>
                <h3 className="text-sm font-medium text-card-foreground line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="flex items-baseline space-x-2">
                  <p className="text-lg font-bold text-primary">
                    Ksh. {formatCurrency(parseFloat(product.price))}
                  </p>
                  {product.on_sale && product.regular_price && (
                    <p className="text-sm text-muted-foreground line-through">
                      Ksh. {formatCurrency(parseFloat(product.regular_price))}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )) : []
    );
  };

  return (
    <div className="w-full border-b">
      <div className="container mx-auto px-4 h-14 flex items-center">
        <ShopFiltersProvider>
          <NavigationMenu>
            <NavigationMenuList>
              {/* === Shop by Category Dropdown === */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Shop by Category</NavigationMenuTrigger>
                <NavigationMenuContent >
                  <ul className="grid w-full gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {Array.isArray(categories) && categories.map((component) => (
                      <CategoryListItem
                        key={component.name}
                        title={component.name}
                        href={`/categories/${component.slug}`}
                        slug={component.slug}
                      >
                        {component.description}
                      </CategoryListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              {/* === Featured Products Dropdown === */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Featured Products</NavigationMenuTrigger>
                <NavigationMenuContent>
                  {/* Grid container to hold left gradient link and right scrollable product cards */}
                  <div className="grid w-full gap-3 p-4 md:w-[700px] md:grid-cols-3 lg:w-[900px]">
                    {/* Left panel: keep the gradient link to /deals/new-arrivals */}
                    <div className="col-span-1">
                      <NavigationMenuLink asChild>
                        <NavigationLink
                          className="from-primary/5 to-primary/10 flex h-full select-none flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-none focus:shadow-md"
                          href="/featured"
                          pendingClassName="opacity-50"
                        >
                          <div className="mb-2 mt-4 text-lg font-medium">Featured Products</div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Explore our handpicked selection of top medical devices.
                          </p>
                        </NavigationLink>
                      </NavigationMenuLink>
                    </div>

                    {/* Right panel: horizontally scrollable product cards to mimic NewArrivals component */}
                    <div className="col-span-2 w-full md:col-span-2 relative">
                      {/* Left chevron (visible on md+) */}
                      <button
                        type="button"
                        aria-label="Scroll left"
                        onClick={() => scrollBy(-240)}
                        className="hidden md:flex items-center justify-center absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-card p-1 shadow-sm hover:bg-accent border"
                        data-role="left-chev"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      {/* Right chevron (visible on md+) */}
                      <button
                        type="button"
                        aria-label="Scroll right"
                        onClick={() => scrollBy(240)}
                        className="hidden md:flex items-center justify-center absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-card p-1 shadow-sm hover:bg-accent border"
                        data-role="right-chev"
                      >
                        <ChevronRight size={18} />
                      </button>

                      {/* Scroll rail with ref (hide native scrollbar) */}
                      <div ref={scrollRef} className="overflow-x-auto hide-scrollbar">
                        <div className="flex space-x-6 pb-4">
                          {renderProductCards(featuredProducts.products)}
                        </div>

                        {/* Left fade */}
                        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 md:block hidden">
                          <div className="h-full w-full bg-gradient-to-r from-card/80 to-transparent dark:from-card/60"></div>
                        </div>

                        {/* Right fade */}
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 md:block hidden">
                          <div className="h-full w-full bg-gradient-to-l from-card/80 to-transparent dark:from-card/60"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* === Shop by New Arrivals Dropdown === */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>New Arrivals</NavigationMenuTrigger>
                <NavigationMenuContent>
                  {/* Grid container to hold left gradient link and right scrollable product cards */}
                  <div className="grid w-full gap-3 p-4 md:w-[700px] md:grid-cols-3 lg:w-[900px]">
                    {/* Left panel: keep the gradient link to /deals/new-arrivals */}
                    <div className="col-span-1">
                      <NavigationMenuLink asChild>
                        <NavigationLink
                          className="from-primary/5 to-primary/10 flex h-full select-none flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-none focus:shadow-md"
                          href="/new-arrivals"
                          pendingClassName="opacity-50"
                        >
                          <div className="mb-2 mt-4 text-lg font-medium">New Arrivals</div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Check out the latest technology in medical equipment.
                          </p>
                        </NavigationLink>
                      </NavigationMenuLink>
                    </div>

                    {/* Right panel: horizontally scrollable product cards to mimic NewArrivals component */}
                    <div className="col-span-2 w-full md:col-span-2 relative">
                      {/* Left chevron (visible on md+) */}
                      <button
                        type="button"
                        aria-label="Scroll left"
                        onClick={() => scrollBy(-240)}
                        className="hidden md:flex items-center justify-center absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-card p-1 shadow-sm hover:bg-accent border"
                        data-role="left-chev"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      {/* Right chevron (visible on md+) */}
                      <button
                        type="button"
                        aria-label="Scroll right"
                        onClick={() => scrollBy(240)}
                        className="hidden md:flex items-center justify-center absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-card p-1 shadow-sm hover:bg-accent border"
                        data-role="right-chev"
                      >
                        <ChevronRight size={18} />
                      </button>

                      {/* Scroll rail with ref (hide native scrollbar) */}
                      <div ref={scrollRef} className="overflow-x-auto hide-scrollbar">
                        <div className="flex space-x-6 pb-4">
                          {renderProductCards(newArrivalProducts.products)}
                        </div>

                        {/* Left fade */}
                        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 md:block hidden">
                          <div className="h-full w-full bg-gradient-to-r from-card/80 to-transparent dark:from-card/60"></div>
                        </div>

                        {/* Right fade */}
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 md:block hidden">
                          <div className="h-full w-full bg-gradient-to-l from-card/80 to-transparent dark:from-card/60"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>


              {/* === Simple Link to All Products === */}
              <NavigationMenuItem>
                {/* Keep this as a simple link but ensure it uses the same trigger styling so spacing matches */}
                <NavigationMenuLink asChild>
                  <NavigationLink className={navigationMenuTriggerStyle()} href="/products" pendingClassName="opacity-50">
                    Shop
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
