"use client";

import React from "react";
import type { FC } from "react";
import { X, ShoppingCart, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCompareStore } from "@/lib/store/useCompareStore";
import useCartStore from "@/lib/store/useCartStore";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from "@/lib/utils/utils";

const MAX_COMPARE = 4;

const CompareProducts: FC = () => {
  const compareItems = useCompareStore((state) => state.items);
  const removeFromCompare = useCompareStore((state) => state.removeItem);
  const clearCompare = useCompareStore((state) => state.clear);
  const addToCart = useCartStore((state) => state.addItem);

  const products = compareItems ?? [];

  const [highlightDiffs, setHighlightDiffs] = React.useState(false);

  const remove = (id: string | number) => removeFromCompare(id);
  const clear = () => clearCompare();

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
    const productName = product?.name ?? 'Product';
    toast.success(`${productName} added to cart`);
  };

  const formatPrice = (p?: number) => {
    if (p === undefined || p === null) return "-";
    return `Ksh. ${formatCurrency(Number(p))}`;
  };

  const normalize = (p: any) => {
    const id = (p?.id ?? p?.sku ?? p?.slug) as any;
    const name = p?.name ?? String(id ?? "");
    const image = p?.image ?? (p?.images ? (Array.isArray(p.images) ? (p.images[0]?.src ?? p.images[0]?.url ?? p.images[0]) : undefined) : undefined);
    const price = Number(p?.price ?? p?.regular_price ?? 0);
    return { id, name, image, price, raw: p };
  };

  const emptySlots = Math.max(0, MAX_COMPARE - products.length);

  return (
    <div className="w-full py-8">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Compare Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Compare up to {MAX_COMPARE} products side-by-side.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={clear}
            className="px-3 py-1 rounded border border-border bg-background text-sm hover:bg-muted"
          >
            Clear
          </button>
          <button
            onClick={() => setHighlightDiffs((s) => !s)}
            aria-pressed={highlightDiffs}
            className={`px-3 py-1 rounded border ${highlightDiffs ? 'bg-primary text-white border-primary' : 'bg-background border-border'} text-sm`}
          >
            {highlightDiffs ? 'Highlighting: On' : 'Highlight diffs'}
          </button>
          <div className="text-sm text-muted-foreground">Selected: <span className="font-medium">{products.length}</span>/{MAX_COMPARE}</div>
        </div>
      </div>

      {/* Selected chips + placeholders */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.isArray(products) && products.map((p) => {
          const n = normalize(p);
          return (
            <div key={String(n.id)} className="relative border border-border rounded p-4 bg-card hover:shadow-md transition-shadow flex flex-col">
              <div className="absolute top-3 right-3">
                <button onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`} className="p-1 rounded hover:bg-muted/30 text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center h-full">
                <Image src={n.image ?? '/logos/logo-portrait.png'} alt={n.name} width={144} height={144} className="object-contain mb-3" />
                <h3 className="font-semibold mb-1 text-center">{n.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{formatPrice(n.price)}</p>
                {/* Availability */}
                {((n.raw as any)?.stock_status !== undefined) && (
                  <div className={`text-sm mb-1 ${highlightDiffs && (() => {
                    const vals = Array.isArray(products) ? products.map(pp => (pp as any).stock_status) : [];
                    return new Set(vals.filter(Boolean)).size > 1 ? 'text-yellow-700 font-medium' : 'text-muted-foreground';
                  })()}`}>
                    {(n.raw as any).stock_status === 'instock' ? 'In stock' : 'Out of stock'}
                  </div>
                )}

                {/* Categories */}
                {((n.raw as any).categories) && (
                  <div className="text-sm text-muted-foreground mb-1">
                    {(Array.isArray((n.raw as any).categories) ? (n.raw as any).categories.map((c: any) => c?.name ?? c).join(', ') : String((n.raw as any).categories))}
                  </div>
                )}

                {/* Short description */}
                {(n.raw as any).short_description && (
                  <p className="text-sm text-muted-foreground mt-1 mb-3 line-clamp-3">{(n.raw as any).short_description}</p>
                )}

                <div className="mt-auto w-full">
                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={() => handleAddToCart(p)}
                      className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded bg-primary text-white`}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`slot-${i}`} className="border border-dashed border-border rounded p-6 flex flex-col items-center justify-center bg-background">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-muted mb-3">
              <Plus className="h-6 w-6 text-foreground" />
            </div>
            <div className="text-sm font-medium mb-2">Add product</div>
            <Link href="/shop" className="w-full">
              <Button className="w-full">Browse products</Button>
            </Link>
          </div>
        ))}
      </div>

      {/* Price summary + Comparison table (only shows feature rows when >= 2 items) */}
      {products.length >= 2 && (
        (() => {
          const prices = Array.isArray(products) ? products.map((p) => Number(p.price)).filter((v) => !Number.isNaN(v)) : [];
          const min = prices.length ? Math.min(...prices) : undefined;
          const max = prices.length ? Math.max(...prices) : undefined;
          const diff = min !== undefined && max !== undefined ? max - min : undefined;

          return (
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">Price summary:</div>
              <div className="flex items-center gap-3">
                <div className="text-sm"><span className="text-muted-foreground">Min:</span> <span className="font-medium">{min !== undefined ? formatPrice(min) : '-'}</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Max:</span> <span className="font-medium">{max !== undefined ? formatPrice(max) : '-'}</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Difference:</span> <span className="font-medium">{diff !== undefined ? formatPrice(diff) : '-'}</span></div>
              </div>
            </div>
          );
        })()
      )}

      {/* Comparison table (only shows feature rows when >= 2 items) */}
      {products.length < 2 ? (
        <div className="text-center text-muted-foreground">Select two or more products to compare.</div>
      ) : (
        <div className="hidden md:block overflow-x-auto border border-border rounded bg-background">
          <table className="min-w-full table-auto">
            <thead className="bg-muted/30">
              <tr>
                <th className="p-4 text-left sticky left-0 bg-muted/30 z-10">Feature</th>
                {Array.isArray(products) && products.map((p) => {
                  const n = normalize(p);
                  return (
                    <th key={String(n.id)} className="p-4 text-left border-l">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-center">
                          <div className="font-medium text-sm">{n.name}</div>
                          <div className="flex items-center gap-2 mt-1 justify-center">
                            <button
                              onClick={() => handleAddToCart(p)}
                              aria-label={`Add ${n.name} to cart`}
                              className="p-1 rounded hover:bg-muted/30 text-foreground"
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </button>
                            <button onClick={() => remove(n.id)} aria-label={`Remove ${n.name}`} className="p-1 rounded hover:bg-muted/30 text-red-500">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-4 font-medium">Price</td>
                {Array.isArray(products) && products.map((p) => {
                  const n = normalize(p);
                  return <td key={String(n.id)} className={`p-4 border-l ${highlightDiffs && (() => {
                    const values = Array.isArray(products) ? products.map(pp => Number((pp as any).price ?? (pp as any).regular_price ?? 0)) : [];
                    return new Set(values.filter(v => v !== undefined && v !== null)).size > 1 ? 'bg-yellow-50 ring-1 ring-yellow-200' : '';
                  })()}`}>{formatPrice(n.price)}</td>
                })}
              </tr>

              <tr>
                <td className="p-4 font-medium">Availability</td>
                {Array.isArray(products) && products.map((p) => {
                  const n = normalize(p);
                  return <td key={String(n.id)} className={`p-4 border-l ${highlightDiffs && (() => {
                    const values = Array.isArray(products) ? products.map(pp => (pp as any).stock_status) : [];
                    return new Set(values.filter(v => v !== undefined && v !== null)).size > 1 ? 'bg-yellow-50 ring-1 ring-yellow-200' : '';
                  })()}`}>
                    {((n.raw as any).stock_status === undefined) ? '-' : ((n.raw as any).stock_status === 'instock' ? 'In stock' : 'Out of stock')}
                  </td>
                })}
              </tr>

              <tr className="bg-muted/10">
                <td className="p-4 font-medium">Categories</td>
                {Array.isArray(products) && products.map((p) => {
                  const n = normalize(p);
                  return <td key={String(n.id)} className={`p-4 border-l ${highlightDiffs && (() => {
                    const values = Array.isArray(products) ? products.map(pp => JSON.stringify((pp as any).categories || '')) : [];
                    return new Set(values.filter(v => v !== undefined && v !== null)).size > 1 ? 'bg-yellow-50 ring-1 ring-yellow-200' : '';
                  })()}`}>
                    {((n.raw as any).categories) ? (Array.isArray((n.raw as any).categories) ? (n.raw as any).categories.map((c: any) => c?.name ?? c).join(', ') : String((n.raw as any).categories)) : '-'}
                  </td>
                })}
              </tr>

              <tr>
                <td className="p-4 font-medium">Short Description</td>
                {Array.isArray(products) && products.map((p) => {
                  const n = normalize(p);
                  return <td key={String(n.id)} className={`p-4 border-l ${highlightDiffs && (() => {
                    const values = Array.isArray(products) ? products.map(pp => (pp as any).short_description || '') : [];
                    return new Set(values.filter(v => v !== undefined && v !== null)).size > 1 ? 'bg-yellow-50 ring-1 ring-yellow-200' : '';
                  })()}`}>
                    {(n.raw as any).short_description ? <div className="text-sm text-muted-foreground line-clamp-3">{(n.raw as any).short_description}</div> : '-'}
                  </td>
                })}
              </tr>

              <tr className="bg-muted/10">
                <td className="p-4 font-medium">Image</td>
                {Array.isArray(products) && products.map((p) => {
                  const n = normalize(p);
                  return <td key={String(n.id)} className={`p-4 border-l ${highlightDiffs && (() => {
                    const values = Array.isArray(products) ? products.map(pp => (pp as any).image ?? (pp as any).images?.[0]) : [];
                    return new Set(values.filter(v => v !== undefined && v !== null)).size > 1 ? 'bg-yellow-50 ring-1 ring-yellow-200' : '';
                  })()}`}>
                    <div className="w-28 h-28 relative">
                      <Image src={n.image ?? '/logos/logo-portrait.png'} alt={n.name} fill className="object-contain" sizes="112px" />
                    </div>
                  </td>
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CompareProducts;
