"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Percent,
  CheckCircle2,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBundles, Bundle } from "@/lib/hooks/useBundles";
import { cn } from "@/lib/utils";

export const CuratedBundlesSection: React.FC = () => {
  const { data: bundles = [], isLoading } = useBundles();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = 380;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    });
  };

  // If not loading and no bundles, don't show empty void
  if (!isLoading && bundles.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-10" aria-label="Curated Medical Equipment Bundles">
      {/* Outer Glow Wrapper */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-card via-card/90 to-card/60 border border-primary/20 p-6 sm:p-8 lg:p-10 shadow-xl">
        {/* Subtle Ambient Gradient Lighting */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Practitioner Value Kits</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
              Curated Medical Bundles & Packages
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              Equip your clinic or home care with complete, compatible medical device sets. Enjoy pre-applied platform savings and unified delivery.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Scroll Navigation Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("left")}
                className="h-10 w-10 rounded-xl bg-background/80 hover:bg-background border-border/80 shadow-xs cursor-pointer"
                aria-label="Scroll bundles left"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("right")}
                className="h-10 w-10 rounded-xl bg-background/80 hover:bg-background border-border/80 shadow-xs cursor-pointer"
                aria-label="Scroll bundles right"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              asChild
              className="h-10 px-5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
            >
              <Link href="/products?product_type=bundle" className="flex items-center gap-1.5">
                <span>View All Bundles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Custom Bundle Row / Cards Carousel */}
        {isLoading ? (
          <div className="flex gap-5 overflow-x-auto hide-scrollbar pb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[320px] sm:min-w-[380px] h-[340px] rounded-2xl bg-muted/30 border border-border animate-pulse p-6 flex flex-col justify-between"
              >
                <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-6" />
                <div className="h-10 bg-muted rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto hide-scrollbar scroll-smooth pb-3 snap-x snap-mandatory"
          >
            {bundles.map((bundle) => {
              const grossPrice = Number(bundle.gross_customer_price || 0);
              const netPrice = Number(bundle.net_customer_price || grossPrice);
              const discountAmount = Number(bundle.discount_amount || (grossPrice - netPrice));
              const savingsPercent =
                grossPrice > 0
                  ? Math.round((discountAmount / grossPrice) * 100)
                  : bundle.discount_type === "PERCENTAGE"
                  ? Math.round(bundle.discount_value)
                  : 0;

              const totalUnits =
                bundle.components?.reduce((sum, c) => sum + (c.quantity || 1), 0) ||
                bundle.components?.length ||
                1;

              return (
                <div
                  key={bundle.id}
                  className="group min-w-[310px] sm:min-w-[380px] max-w-[420px] rounded-2xl bg-card border border-border/80 hover:border-primary/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-6 shrink-0 snap-start relative overflow-hidden"
                >
                  {/* Diagonal Top Gradient Flare */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500 pointer-events-none" />

                  <div>
                    {/* Top Row: Device Count & Savings Badge */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/80 px-3 py-1 rounded-full">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span>{totalUnits} Medical Devices</span>
                      </span>

                      {savingsPercent > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full shadow-2xs">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Save {savingsPercent}%</span>
                        </span>
                      )}
                    </div>

                    {/* Bundle Title */}
                    <h3 className="text-lg sm:text-xl font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                      {bundle.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                      {bundle.description ||
                        "Certified equipment kit configured for maximum clinical efficiency and reliability."}
                    </p>

                    {/* Component Device Preview Pills */}
                    {bundle.components && bundle.components.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Package Includes:
                        </p>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {bundle.components.slice(0, 3).map((comp, idx) => (
                            <div
                              key={comp.id || idx}
                              className="flex items-center justify-between text-xs text-foreground/90 bg-muted/40 px-2.5 py-1 rounded-lg"
                            >
                              <span className="truncate max-w-[200px] font-medium">
                                {comp.product_name}
                              </span>
                              <span className="text-[11px] font-bold text-muted-foreground shrink-0">
                                ×{comp.quantity}
                              </span>
                            </div>
                          ))}
                          {bundle.components.length > 3 && (
                            <p className="text-[10px] text-muted-foreground italic pl-1">
                              +{bundle.components.length - 3} more clinical items
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price & Action Area */}
                  <div className="mt-6 pt-4 border-t border-border/80 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">
                        Bundle Price
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xl sm:text-2xl font-extrabold text-primary">
                          Ksh {netPrice.toLocaleString()}
                        </span>
                        {grossPrice > netPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            Ksh {grossPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      asChild
                      size="sm"
                      className="h-10 px-4 rounded-xl font-bold text-xs bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-xs group-hover:shadow-md"
                    >
                      <Link href={`/products/${bundle.slug}`} className="flex items-center gap-1.5">
                        <span>Get Bundle</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default CuratedBundlesSection;
