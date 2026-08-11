"use client";

import React, { useState } from "react";
import type { FC } from "react";
import { X, ShoppingCart, Plus, Scale, ArrowRight, ShieldCheck, Check, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useCompareStore } from "@/lib/store/useCompareStore";
import useCartStore from "@/lib/store/useCartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/utils";
import { motion, AnimatePresence } from "framer-motion";

const MAX_COMPARE = 4;

const CompareProducts: FC = () => {
  const compareItems = useCompareStore((state) => state.items);
  const removeFromCompare = useCompareStore((state) => state.removeItem);
  const clearCompare = useCompareStore((state) => state.clear);
  const addToCart = useCartStore((state) => state.addItem);
  const isInCart = useCartStore((state) => state.isInCart);

  const products = compareItems ?? [];
  const [highlightDiffs, setHighlightDiffs] = useState(false);

  const remove = (id: string | number) => removeFromCompare(id);
  const clear = () => clearCompare();

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
    toast.success(`${product?.name || "Product"} added to cart`);
  };

  const formatPrice = (p?: number) => {
    if (p === undefined || p === null || isNaN(p)) return "-";
    return `Ksh ${formatCurrency(Number(p))}`;
  };

  const normalize = (p: any) => {
    const id = p?.id ?? p?.sku ?? p?.slug;
    const name = p?.name ?? "Medical Equipment";
    const image = p?.image ?? (Array.isArray(p?.images) ? (p.images[0]?.src ?? p.images[0]?.url ?? p.images[0]) : p?.images);
    const price = Number(p?.price ?? p?.regular_price ?? 0);
    return { id, name, image, price, raw: p };
  };

  const emptySlots = Math.max(0, MAX_COMPARE - products.length);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border bg-card text-card-foreground p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              <Scale className="w-4 h-4" /> Device Comparison Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              Compare Medical Devices
              <Badge variant="secondary" className="px-2.5 py-0.5 text-sm font-medium rounded-full">
                {products.length} / {MAX_COMPARE}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Compare technical specs, regulatory certifications, pricing, and stock status side-by-side.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={highlightDiffs ? "default" : "outline"}
              size="sm"
              onClick={() => setHighlightDiffs((s) => !s)}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {highlightDiffs ? "Highlighting Diffs: On" : "Highlight Differences"}
            </Button>
            {products.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clear}
                className="text-muted-foreground hover:text-destructive"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Selected Products Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence>
          {Array.isArray(products) && products.map((p) => {
            const n = normalize(p);
            const inCart = isInCart(n.id);

            return (
              <motion.div
                key={String(n.id)}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="relative overflow-hidden border shadow-xs hover:shadow-md transition-shadow flex flex-col h-full bg-card">
                  <button
                    onClick={() => remove(p.id)}
                    aria-label={`Remove ${n.name}`}
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-muted/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <CardContent className="p-5 flex flex-col items-center text-center h-full">
                    <div className="relative w-36 h-36 rounded-lg bg-muted/30 p-2 mb-4 flex items-center justify-center overflow-hidden border">
                      <Image
                        src={n.image || "/logos/logo-portrait.png"}
                        alt={n.name}
                        fill
                        className="object-contain p-2"
                        sizes="144px"
                      />
                    </div>

                    <Link href={`/products/${(n.raw as any).slug || n.id}`} className="font-semibold text-foreground hover:text-primary line-clamp-2 mb-2">
                      {n.name}
                    </Link>

                    <div className="text-lg font-bold text-foreground mb-3">
                      {formatPrice(n.price)}
                    </div>

                    <div className="space-y-2 w-full text-xs mb-4">
                      <Badge variant="outline" className="w-full justify-center gap-1 border-primary/30 text-primary bg-primary/5 py-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> PPB / KMPDB Certified
                      </Badge>

                      <div className="text-muted-foreground flex items-center justify-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${(n.raw as any)?.stock_status === 'instock' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {(n.raw as any)?.stock_status === 'instock' ? 'In Stock (Central Warehouse)' : 'Special Order / In Stock'}
                      </div>
                    </div>

                    <div className="mt-auto w-full pt-2 border-t">
                      <Button
                        onClick={() => handleAddToCart(p)}
                        variant={inCart ? "secondary" : "default"}
                        className="w-full gap-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {inCart ? "In Cart" : "Add to Cart"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {Array.from({ length: emptySlots }).map((_, i) => (
          <Card key={`slot-${i}`} className="border-dashed border-2 p-6 flex flex-col items-center justify-center text-center bg-muted/10 min-h-[360px]">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Add Product to Compare</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
              Select another medical device to analyze specifications side-by-side.
            </p>
            <Link href="/products">
              <Button variant="outline" size="sm" className="gap-1.5">
                Browse Catalog
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      {/* Comparison Detailed Matrix Table */}
      {products.length >= 2 ? (
        <Card className="overflow-hidden border shadow-xs bg-card">
          <div className="p-4 bg-muted/40 border-b flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" /> Technical Specification Comparison Matrix
            </h3>
            {(() => {
              const prices = products.map((p) => Number(p.price)).filter((v) => !isNaN(v) && v > 0);
              const min = prices.length ? Math.min(...prices) : undefined;
              const max = prices.length ? Math.max(...prices) : undefined;
              const diff = min !== undefined && max !== undefined ? max - min : undefined;

              return (
                <div className="text-xs text-muted-foreground flex items-center gap-4">
                  <span>Price Range: <strong>{min ? formatPrice(min) : "-"}</strong> – <strong>{max ? formatPrice(max) : "-"}</strong></span>
                  {diff !== undefined && diff > 0 && (
                    <Badge variant="outline" className="bg-background text-foreground">
                      Max Price Diff: {formatPrice(diff)}
                    </Badge>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/20 text-xs font-semibold text-muted-foreground uppercase border-b">
                <tr>
                  <th className="p-4 w-48">Feature / Metric</th>
                  {products.map((p) => {
                    const n = normalize(p);
                    return (
                      <th key={String(n.id)} className="p-4 border-l min-w-[220px]">
                        <div className="font-medium text-foreground truncate">{n.name}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-4 font-medium text-muted-foreground bg-muted/10">Price (Ksh)</td>
                  {products.map((p) => {
                    const n = normalize(p);
                    const isDiff = highlightDiffs && new Set(products.map(item => Number(item.price || 0))).size > 1;
                    return (
                      <td key={String(n.id)} className={`p-4 border-l font-semibold text-foreground ${isDiff ? "bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200" : ""}`}>
                        {formatPrice(n.price)}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="p-4 font-medium text-muted-foreground bg-muted/10">Regulatory Standard</td>
                  {products.map((p) => {
                    return (
                      <td key={String(p.id)} className="p-4 border-l">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 text-xs gap-1">
                          <ShieldCheck className="w-3 h-3" /> PPB / KMPDB Certified
                        </Badge>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="p-4 font-medium text-muted-foreground bg-muted/10">Stock Availability</td>
                  {products.map((p) => {
                    const status = (p as any)?.stock_status || "instock";
                    const isDiff = highlightDiffs && new Set(products.map(item => (item as any)?.stock_status)).size > 1;
                    return (
                      <td key={String(p.id)} className={`p-4 border-l ${isDiff ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${status === "instock" ? "text-emerald-600" : "text-amber-600"}`}>
                          <span className={`w-2 h-2 rounded-full ${status === "instock" ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {status === "instock" ? "In Stock (Central Warehouse)" : "Available on Request"}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="p-4 font-medium text-muted-foreground bg-muted/10">Category</td>
                  {products.map((p) => {
                    const catName = (p as any)?.category?.name || (Array.isArray((p as any)?.categories) ? (p as any).categories[0]?.name : "-");
                    return (
                      <td key={String(p.id)} className="p-4 border-l text-muted-foreground">
                        {catName || "Medical Equipment"}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="p-4 font-medium text-muted-foreground bg-muted/10">Description Summary</td>
                  {products.map((p) => {
                    const desc = (p as any)?.short_description || (p as any)?.description || "Certified medical grade product.";
                    return (
                      <td key={String(p.id)} className="p-4 border-l text-xs text-muted-foreground leading-relaxed">
                        <div className="line-clamp-3">{desc}</div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      ) : products.length === 1 ? (
        <div className="p-6 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>Add at least one more product to unlock the detailed specification comparison table.</span>
        </div>
      ) : null}
    </div>
  );
};

export default CompareProducts;

