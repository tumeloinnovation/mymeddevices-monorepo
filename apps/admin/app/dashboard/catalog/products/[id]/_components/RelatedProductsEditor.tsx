"use client";

import React, { useState, useEffect } from "react";
import { Link2, Search, Plus, Trash2, Package, ArrowUpRight, Shield, Layers, HelpCircle, Box, ToggleLeft, ToggleRight, Minus, Plus as PlusIcon } from "lucide-react";
import { catalogService, RelatedProduct, Product, RelationType, BundleItem } from "@mymeddevices/shared-core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface RelatedProductsEditorProps {
  productId: string;
  initialProductType?: 'simple' | 'bundle';
}

const RELATED_RELATION_TYPES: { type: RelationType; title: string; desc: string; bidirectionalDefault: boolean }[] = [
  {
    type: "cross_sell",
    title: "Cross-Sell Items",
    desc: "Complementary clinical products commonly purchased alongside this device.",
    bidirectionalDefault: true
  },
  {
    type: "upsell",
    title: "Upsell Alternatives",
    desc: "Higher-tier models or upgraded configurations recommended to buyers.",
    bidirectionalDefault: false
  }
];

type ProductType = 'simple' | 'bundle';
type EditorMode = 'related' | 'bundle';
type BundleViewMode = 'components' | 'cross_sell';

export function RelatedProductsEditor({ productId, initialProductType = 'simple' }: RelatedProductsEditorProps) {
  const [productType, setProductType] = useState<ProductType>(initialProductType);
  const [editorMode, setEditorMode] = useState<EditorMode>('related');
  const [bundleViewMode, setBundleViewMode] = useState<BundleViewMode>('components');
  const [relations, setRelations] = useState<RelatedProduct[]>([]);
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeRelationType, setActiveRelationType] = useState<RelationType>("cross_sell");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Track pending bundle item additions (optional status for search results)
  const [pendingBundleItems, setPendingBundleItems] = useState<Record<string, { isOptional: boolean }>>({});

  // Clear pending state when search results change
  useEffect(() => {
    if (searchResults.length === 0) {
      setPendingBundleItems({});
    }
  }, [searchResults.length]);

  // Sync editor mode with product type
  // Note: Bundles can have both bundle components AND cross-sell/upsell items
  useEffect(() => {
    setEditorMode(productType === 'bundle' ? 'bundle' : 'related');
  }, [productType]);

  const loadRelations = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await catalogService.getRelatedProducts(productId);
      setRelations(data);
    } catch (err) {
      console.error("Failed to load related products:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadBundleItems = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await catalogService.getBundleItems(productId);
      setBundleItems(data);
    } catch (err) {
      console.error("Failed to load bundle items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRelations();
    loadBundleItems();
  }, [productId]);

  const handleProductTypeChange = async (newType: ProductType) => {
    if (newType === productType) return;

    // Confirm before changing type
    const confirmMessage = newType === 'bundle'
      ? 'Converting to bundle will enable bundle item management. Accessories/spare parts relations will be preserved but can be managed as bundle components instead. Continue?'
      : 'Converting to simple product will disable bundle items. They will be removed from the bundle configuration. Continue?';

    if (!confirm(confirmMessage)) return;

    setProductType(newType);

    // Update product type via API
    try {
      await catalogService.updateProduct(productId, { product_type: newType } as any);
      // Reload data after type change
      if (newType === 'bundle') {
        loadBundleItems();
      }
    } catch (err: any) {
      console.error("Failed to update product type:", err);
      alert(err.message || "Failed to update product type");
      // Revert on error
      setProductType(productType);
    }
  };

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
      setSearchResults((resp.products || []).filter(p => p.id !== productId));
    } catch (err) {
      console.error("Failed to search products:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Related Products Handlers
  const handleAddRelation = async (targetProduct: Product) => {
    const config = RELATED_RELATION_TYPES.find(r => r.type === activeRelationType);
    const isBidi = config ? config.bidirectionalDefault : true;

    try {
      const rel = await catalogService.addRelatedProduct(productId, {
        related_product_id: targetProduct.id,
        relation_type: activeRelationType,
        is_bidirectional: isBidi,
        sort_order: relations.length
      });
      setRelations(prev => [...prev, rel]);
      setSearchResults(prev => prev.filter(p => p.id !== targetProduct.id));
    } catch (err: any) {
      alert(err.message || "Failed to link related product");
    }
  };

  const handleRemoveRelation = async (relationId: string) => {
    try {
      await catalogService.removeRelatedProduct(productId, relationId);
      setRelations(prev => prev.filter(r => r.id !== relationId));
    } catch (err) {
      console.error("Failed to remove relation:", err);
    }
  };

  // Bundle Items Handlers
  const handleAddBundleItem = async (targetProduct: Product, isOptional: boolean = false) => {
    try {
      const item = await catalogService.addBundleItem(productId, {
        component_product_id: targetProduct.id,
        quantity: 1,
        is_optional: isOptional,
        sort_order: bundleItems.length
      });
      setBundleItems(prev => [...prev, item]);
      setSearchResults(prev => prev.filter(p => p.id !== targetProduct.id));
    } catch (err: any) {
      alert(err.message || "Failed to add bundle item");
    }
  };

  const handleRemoveBundleItem = async (itemId: string) => {
    try {
      await catalogService.removeBundleItem(productId, itemId);
      setBundleItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error("Failed to remove bundle item:", err);
    }
  };

  const handleUpdateBundleItem = async (itemId: string, updates: Partial<{ is_optional: boolean }>) => {
    try {
      const updated = await catalogService.updateBundleItem(productId, itemId, updates);
      setBundleItems(prev => prev.map(item => item.id === itemId ? updated : item));
    } catch (err) {
      console.error("Failed to update bundle item:", err);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <CardHeader className="py-4 px-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                {editorMode === 'bundle' ? (
                  <><Box className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Bundle Manager</>
                ) : (
                  <><Link2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Related Products Manager</>
                )}
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                {editorMode === 'bundle'
                  ? bundleViewMode === 'components'
                    ? `${bundleItems.length} Components`
                    : `${relations.length} Related`
                  : `${relations.length} Links`}
              </Badge>
            </div>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            {editorMode === 'bundle'
              ? bundleViewMode === 'components'
                ? 'Manage bundle components, set quantities, and mark items as optional for the complete package.'
                : 'Link cross-sell items and upgrade recommendations for this bundle.'
              : 'Link cross-sell items and upgrade recommendations for this product.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Product Type Toggle */}
          <div className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                {productType === 'bundle' ? <Box className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Product Type: <span className="font-mono uppercase">{productType}</span>
                </p>
                <p className="text-xs text-zinc-500">
                  {productType === 'bundle'
                    ? 'Bundle products contain multiple components sold together at a bundled price.'
                    : 'Simple products are standalone items with optional related product links.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={productType === 'simple' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleProductTypeChange('simple')}
                className="text-xs"
              >
                <Package className="h-3.5 w-3.5 mr-1.5" /> Simple
              </Button>
              <Button
                type="button"
                variant={productType === 'bundle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleProductTypeChange('bundle')}
                className="text-xs"
              >
                <Box className="h-3.5 w-3.5 mr-1.5" /> Bundle
              </Button>
            </div>
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          {/* Bundle Mode: View Toggle between Components and Related Products */}
          {editorMode === 'bundle' && (
            <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setBundleViewMode('components')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all",
                  bundleViewMode === 'components'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Box className="h-3.5 w-3.5" />
                Bundle Components ({bundleItems.length})
              </button>
              <button
                type="button"
                onClick={() => setBundleViewMode('cross_sell')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all",
                  bundleViewMode === 'cross_sell'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Link2 className="h-3.5 w-3.5" />
                Cross-Sell & Upsell ({relations.length})
              </button>
            </div>
          )}

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          {/* Bundle Items Mode */}
          {editorMode === 'bundle' && bundleViewMode === 'components' && (
            <>
              {/* Bundle Items List */}
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Bundle Components ({bundleItems.length})</span>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    Items included in this bundle package
                  </span>
                </Label>

                {bundleItems.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                    <Box className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500 font-medium">No bundle components added yet.</p>
                    <p className="text-xs text-zinc-400 mt-1">Search and add products below to build your bundle.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bundleItems.map((item, index) => (
                      <div key={item.id} className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="text-xs font-mono text-zinc-400 w-6">
                          #{index + 1}
                            </div>
                            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center shrink-0">
                              {item.component_product?.image_url ? (
                                <img src={item.component_product.image_url} alt={item.component_product.name} className="w-8 h-8 object-contain" />
                              ) : (
                                <Package className="h-5 w-5 text-zinc-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                {item.component_product?.name || "Component Item"}
                              </p>
                              <p className="text-xs text-zinc-500 font-mono">
                                SKU: {item.component_product?.sku || "N/A"} · Price: KES {(item.component_product?.price || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Optional Toggle */}
                            <div className="flex items-center gap-2">
                              <Label className="text-[10px] uppercase text-zinc-500">Optional</Label>
                              <Switch
                                checked={item.is_optional}
                                onCheckedChange={(checked) => handleUpdateBundleItem(item.id, { is_optional: checked })}
                                className="data-[state=true]:bg-emerald-600"
                              />
                            </div>

                            <Badge variant={item.is_optional ? "outline" : "default"} className="text-[10px]">
                              {item.is_optional ? "Optional" : "Required"}
                            </Badge>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveBundleItem(item.id)}
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="bg-zinc-200 dark:border-zinc-800" />

              {/* Add Bundle Item Section */}
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                  Add Component to Bundle
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      placeholder="Search catalog to add bundle component..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                      className="pl-9 text-xs font-mono"
                    />
                  </div>
                  <Button type="button" onClick={handleSearch} disabled={searchLoading || !searchQuery.trim()} variant="outline" className="text-xs">
                    {searchLoading ? "Searching..." : "Search"}
                  </Button>
                </div>

                {/* Bundle Item Add Options */}
                {searchResults.length > 0 && (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/40 space-y-2">
                    <p className="text-[10px] font-semibold uppercase text-zinc-500">Search Results</p>
                    <div className="space-y-2">
                      {searchResults.map(prod => {
                        const pending = pendingBundleItems[prod.id] || { isOptional: false };

                        return (
                          <div key={prod.id} className="p-3 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center">
                                  {prod.images?.[0]?.url ? (
                                    <img src={prod.images[0].url} alt={prod.name} className="w-6 h-6 object-contain" />
                                  ) : (
                                    <Package className="h-4 w-4 text-zinc-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-xs text-zinc-900 dark:text-zinc-100">{prod.name}</p>
                                  <p className="text-[10px] text-zinc-500 font-mono">SKU: {prod.sku || "N/A"} · KES {(prod.price || 0).toLocaleString()}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Label className="text-[10px]">Optional</Label>
                                  <Switch
                                    checked={pending.isOptional}
                                    onCheckedChange={(checked) => setPendingBundleItems(prev => ({
                                      ...prev,
                                      [prod.id]: { isOptional: checked }
                                    }))}
                                    className="data-[state=true]:bg-emerald-600"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleAddBundleItem(prod, pending.isOptional)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7"
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Add
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Related Products Mode (Simple Product or Cross-sell/Upsell for Bundles) */}
          {(editorMode === 'related' || (editorMode === 'bundle' && bundleViewMode === 'cross_sell')) && (
            <>
              {/* Relation Type Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Select Relation Category
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {RELATED_RELATION_TYPES.map((rel) => {
                    const count = relations.filter((r) => r.relation_type === rel.type).length;
                    const isSelected = activeRelationType === rel.type;
                    const IconComponent = rel.type === "cross_sell" ? Link2 : HelpCircle;

                    return (
                      <button
                        key={rel.type}
                        type="button"
                        onClick={() => setActiveRelationType(rel.type)}
                        className={cn(
                          "p-4 text-left border rounded-2xl transition-all duration-150 flex flex-col justify-between gap-2.5 cursor-pointer relative group",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                            : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                            )}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-xs text-foreground leading-snug">
                              {rel.title}
                            </span>
                          </div>
                          <Badge
                            variant={isSelected ? "default" : "outline"}
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0",
                              isSelected ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                            )}
                          >
                            {count} {count === 1 ? "Link" : "Links"}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground leading-normal">
                          {rel.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-zinc-200 dark:bg-zinc-800" />

              {/* Search to Link */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Link Product as <strong className="text-emerald-600 font-mono uppercase">{activeRelationType}</strong></span>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    {RELATED_RELATION_TYPES.find(r => r.type === activeRelationType)?.desc}
                  </span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      placeholder={`Search catalog to add ${activeRelationType}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                      className="pl-9 text-xs font-mono"
                    />
                  </div>
                  <Button type="button" onClick={handleSearch} disabled={searchLoading || !searchQuery.trim()} variant="outline" className="text-xs">
                    {searchLoading ? "Searching..." : "Search"}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/40 space-y-2 mt-2">
                    <p className="text-[10px] font-semibold uppercase text-zinc-500">Catalog Results</p>
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
                            onClick={() => handleAddRelation(prod)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Link Product
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-zinc-200 dark:bg-zinc-800" />

              {/* Active Relations List */}
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                  Active Linked Products for {activeRelationType.toUpperCase()} ({relations.filter(r => r.relation_type === activeRelationType).length})
                </Label>

                {relations.filter(r => r.relation_type === activeRelationType).length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                    <Package className="h-6 w-6 text-zinc-400 mx-auto mb-1" />
                    <p className="text-xs text-zinc-500 font-medium">No {activeRelationType} products linked.</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Use the search box above to search and link related products.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {relations.filter(r => r.relation_type === activeRelationType).map(rel => (
                      <div key={rel.id} className="p-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center shrink-0">
                            {rel.related_product?.image_url ? (
                              <img src={rel.related_product.image_url} alt={rel.related_product.name} className="w-7 h-7 object-contain" />
                            ) : (
                              <Package className="h-4 w-4 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{rel.related_product?.name || "Linked Product"}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              SKU: {rel.related_product?.sku || "N/A"} · Price: KES {(rel.related_product?.price || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {rel.is_bidirectional ? "Bidirectional" : "One-Way"}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRelation(rel.id)}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
