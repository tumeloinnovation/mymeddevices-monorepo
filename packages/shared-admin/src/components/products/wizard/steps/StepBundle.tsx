"use client";

import React, { useState, useEffect } from "react";
import { Package, Search, Plus, Trash2, CheckCircle2, AlertCircle, ShoppingBag, ArrowUpRight } from "lucide-react";
import { catalogService, BundleItem, Product } from "@mymeddevices/shared-core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { Separator } from "../../../ui/separator";

interface StepBundleProps {
  productId?: string;
  onBundleItemsUpdated?: (count: number) => void;
}

export function StepBundle({ productId, onBundleItemsUpdated }: StepBundleProps) {
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const loadBundleItems = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const items = await catalogService.getBundleItems(productId);
      setBundleItems(items);
      if (onBundleItemsUpdated) onBundleItemsUpdated(items.length);
    } catch (err) {
      console.error("Failed to load bundle items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBundleItems();
  }, [productId]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const resp = await catalogService.getVendorProducts({
        search: searchQuery,
        status_filter: "published",
        page: 1,
        page_size: 10
      });
      // Exclude self
      setSearchResults((resp.products || []).filter(p => p.id !== productId));
    } catch (err) {
      console.error("Failed to search products:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const addComponent = async (componentProduct: Product) => {
    if (!productId) {
      alert("Please save basic details first.");
      return;
    }

    try {
      const newItem = await catalogService.addBundleItem(productId, {
        component_product_id: componentProduct.id,
        quantity: 1,
        is_optional: false,
        sort_order: bundleItems.length
      });
      setBundleItems(prev => [...prev, newItem]);
      if (onBundleItemsUpdated) onBundleItemsUpdated(bundleItems.length + 1);
      setSearchResults(prev => prev.filter(p => p.id !== componentProduct.id));
    } catch (err: any) {
      alert(err.message || "Failed to add bundle component");
    }
  };

  const handleUpdateItem = async (itemId: string, field: string, value: any) => {
    if (!productId) return;
    try {
      const updated = await catalogService.updateBundleItem(productId, itemId, { [field]: value });
      setBundleItems(prev => prev.map(item => item.id === itemId ? updated : item));
    } catch (err) {
      console.error("Failed to update bundle item:", err);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!productId) return;
    try {
      await catalogService.removeBundleItem(productId, itemId);
      setBundleItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error("Failed to remove bundle item:", err);
    }
  };

  const calculateSumTotal = () => {
    return bundleItems.reduce((acc, item) => {
      const price = item.component_product?.price || 0;
      return acc + (price * item.quantity);
    }, 0);
  };

  const sumTotal = calculateSumTotal();

  return (
    <div className="space-y-6">
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800 py-3.5 px-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Bundle Component Selection
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Select component medical products included in this bundle or kit package.
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {bundleItems.length} Component Products
          </Badge>
        </CardHeader>
        <CardContent className="p-6 space-y-6">

          {/* Component Search Bar */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
              Search & Add Component Products
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                  className="pl-9 text-xs"
                />
              </div>
              <Button
                type="button"
                onClick={handleSearch}
                disabled={searchLoading || !searchQuery.trim()}
                variant="outline"
                className="text-xs font-semibold"
              >
                {searchLoading ? "Searching..." : "Search Catalog"}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/40 space-y-2 mt-2">
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Search Results</p>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {searchResults.map(prod => (
                    <div key={prod.id} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-xs text-zinc-900 dark:text-zinc-100">{prod.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">SKU: {prod.sku || "N/A"} · KES {(prod.price || 0).toLocaleString()}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addComponent(prod)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Component
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          {/* Bundle Summary & Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                Included Components ({bundleItems.length})
              </Label>
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded border border-zinc-200 dark:border-zinc-800">
                Components Individual Total: <span className="font-mono text-emerald-600 dark:text-emerald-400">KES {sumTotal.toLocaleString()}</span>
              </div>
            </div>

            {bundleItems.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                <Package className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 font-medium">No component products added yet.</p>
                <p className="text-[11px] text-zinc-400 mt-1">Use the search bar above to select products that belong to this bundle.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bundleItems.map((item) => (
                  <div key={item.id} className="p-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center shrink-0">
                        {item.component_product?.image_url ? (
                          <img src={item.component_product.image_url} alt={item.component_product.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <Package className="h-5 w-5 text-zinc-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {item.component_product?.name || "Component Product"}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          SKU: {item.component_product?.sku || "N/A"} · Unit Price: KES {(item.component_product?.price || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-[10px] uppercase text-zinc-500">Qty:</Label>
                        <Input
                          type="number"
                          min={1}
                          defaultValue={item.quantity}
                          onBlur={(e) => handleUpdateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                          className="h-7 w-16 text-xs font-mono text-center"
                        />
                      </div>

                      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={item.is_optional}
                          onChange={(e) => handleUpdateItem(item.id, "is_optional", e.target.checked)}
                          className="accent-emerald-600 rounded"
                        />
                        <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">Optional</span>
                      </label>

                      <p className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 w-24 text-right">
                        KES {((item.component_product?.price || 0) * item.quantity).toLocaleString()}
                      </p>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
