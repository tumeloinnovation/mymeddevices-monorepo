"use client";

import React, { useState, useEffect } from "react";
import { Link2, Search, Plus, Trash2, Package, ArrowUpRight, Shield, Layers, HelpCircle, Box, ToggleLeft, ToggleRight, Minus, Plus as PlusIcon, Share2 } from "lucide-react";
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

  const [subTab, setSubTab] = useState<'cross_sell' | 'upsell' | 'bundle'>(
    initialProductType === 'bundle' ? 'bundle' : 'cross_sell'
  );

  useEffect(() => {
    if (productType === 'bundle') {
      setSubTab('bundle');
    } else if (subTab === 'bundle') {
      setSubTab('cross_sell');
    }
  }, [productType]);

  const crossSellCount = relations.filter(r => r.relation_type === 'cross_sell').length;
  const upsellCount = relations.filter(r => r.relation_type === 'upsell').length;

  return (
    <div className="space-y-6">
      <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/60 p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                {productType === 'bundle' ? (
                  <>
                    <Box className="h-4 w-4 text-primary" />
                    Bundle Package &amp; Merchandising
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 text-primary" />
                    Product Relations &amp; Upsell Merchandising
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {productType === 'bundle'
                  ? 'Manage kit components, package quantities, and additional cross-sell accessories.'
                  : 'Configure complementary accessories and premium upgrade recommendations for this device.'}
              </CardDescription>
            </div>

            {/* Sub-Tabs Dock + Product Architecture Action */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              <div className="inline-flex items-center p-1 rounded-xl bg-muted/70 dark:bg-muted/30 border border-border/80 shadow-2xs gap-1">
                {productType === 'bundle' && (
                  <button
                    type="button"
                    onClick={() => setSubTab('bundle')}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer",
                      subTab === 'bundle'
                        ? "bg-card text-foreground font-semibold shadow-xs ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                    )}
                  >
                    <Box className={cn("size-3.5", subTab === 'bundle' ? "text-primary" : "opacity-70")} />
                    <span>Bundle Components</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0 h-4 rounded-full ms-0.5 border border-border/40",
                        subTab === 'bundle' ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {bundleItems.length}
                    </Badge>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { setSubTab('cross_sell'); setActiveRelationType('cross_sell'); }}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer",
                    subTab === 'cross_sell'
                      ? "bg-card text-foreground font-semibold shadow-xs ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                  )}
                >
                  <Link2 className={cn("size-3.5", subTab === 'cross_sell' ? "text-primary" : "opacity-70")} />
                  <span>Cross-Sells</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0 h-4 rounded-full ms-0.5 border border-border/40",
                      subTab === 'cross_sell' ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {crossSellCount}
                  </Badge>
                </button>

                <button
                  type="button"
                  onClick={() => { setSubTab('upsell'); setActiveRelationType('upsell'); }}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer",
                    subTab === 'upsell'
                      ? "bg-card text-foreground font-semibold shadow-xs ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                  )}
                >
                  <ArrowUpRight className={cn("size-3.5", subTab === 'upsell' ? "text-primary" : "opacity-70")} />
                  <span>Upsells</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0 h-4 rounded-full ms-0.5 border border-border/40",
                      subTab === 'upsell' ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {upsellCount}
                  </Badge>
                </button>
              </div>

              {/* Conversion Switcher */}
              {productType === 'simple' ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleProductTypeChange('bundle')}
                  className="h-8 text-xs font-semibold rounded-xl border-dashed border-border/90 hover:bg-muted"
                >
                  <Box className="size-3.5 mr-1.5 text-primary" />
                  Convert to Bundle
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleProductTypeChange('simple')}
                  className="h-8 text-xs font-medium rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <Package className="size-3.5 mr-1.5" />
                  Revert to Simple
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Sub-Tab 1: Cross-Sells */}
          {subTab === 'cross_sell' && (
            <div className="space-y-6">
              <div className="p-4 border border-border/70 rounded-xl bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-foreground">Cross-Sell Items</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Complementary clinical accessories &amp; disposables commonly purchased alongside this medical device.
                  </p>
                </div>
                <Badge variant="outline" className="text-[11px] font-semibold self-start sm:self-auto shrink-0">
                  {crossSellCount} Linked Items
                </Badge>
              </div>

              {/* Search to Link */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-semibold text-foreground flex items-center justify-between">
                  <span>Link Cross-Sell Product</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Search your catalog to link complementary items
                  </span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search catalog by name, brand, SKU or model..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                      className="pl-9 text-xs rounded-xl"
                    />
                  </div>
                  <Button type="button" onClick={handleSearch} disabled={searchLoading || !searchQuery.trim()} variant="outline" className="text-xs rounded-xl">
                    {searchLoading ? "Searching..." : "Search"}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border border-border/80 rounded-xl p-3 bg-muted/30 space-y-2 mt-2">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Catalog Search Results</p>
                    <div className="divide-y divide-border/60">
                      {searchResults.map(prod => (
                        <div key={prod.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/60">
                              {prod.images?.[0]?.url ? (
                                <img src={prod.images[0].url} alt={prod.name} className="w-6 h-6 object-contain rounded" />
                              ) : (
                                <Package className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-xs text-foreground truncate">{prod.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">SKU: {prod.sku || "N/A"} · KES {(prod.price || 0).toLocaleString("en-KE")}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddRelation(prod)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-7 rounded-lg shrink-0"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Link Cross-Sell
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="border-border/60" />

              {/* Active Relations List */}
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                  Active Linked Cross-Sells ({crossSellCount})
                </Label>

                {crossSellCount === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border/80 rounded-2xl p-4 bg-muted/10">
                    <Link2 className="h-7 w-7 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-foreground">No cross-sell products linked yet</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Use the search box above to add complementary items.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {relations.filter(r => r.relation_type === 'cross_sell').map(rel => (
                      <div key={rel.id} className="p-3.5 border border-border/70 bg-card rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0 border border-border/60">
                            {rel.related_product?.image_url ? (
                              <img src={rel.related_product.image_url} alt={rel.related_product.name} className="w-8 h-8 object-contain rounded" />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-foreground truncate">{rel.related_product?.name || "Linked Product"}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              SKU: {rel.related_product?.sku || "N/A"} · Price: KES {(rel.related_product?.price || 0).toLocaleString("en-KE")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {rel.is_bidirectional ? "Bidirectional" : "One-Way"}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRelation(rel.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Upsell Alternatives */}
          {subTab === 'upsell' && (
            <div className="space-y-6">
              <div className="p-4 border border-border/70 rounded-xl bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-foreground">Upsell Alternatives</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Higher-tier models or upgraded configurations recommended to customers considering this item.
                  </p>
                </div>
                <Badge variant="outline" className="text-[11px] font-semibold self-start sm:self-auto shrink-0">
                  {upsellCount} Linked Alternatives
                </Badge>
              </div>

              {/* Search to Link */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-semibold text-foreground flex items-center justify-between">
                  <span>Link Upsell Alternative</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Search higher-tier models or alternative configurations
                  </span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search catalog for upgrade model..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                      className="pl-9 text-xs rounded-xl"
                    />
                  </div>
                  <Button type="button" onClick={handleSearch} disabled={searchLoading || !searchQuery.trim()} variant="outline" className="text-xs rounded-xl">
                    {searchLoading ? "Searching..." : "Search"}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border border-border/80 rounded-xl p-3 bg-muted/30 space-y-2 mt-2">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Catalog Search Results</p>
                    <div className="divide-y divide-border/60">
                      {searchResults.map(prod => (
                        <div key={prod.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/60">
                              {prod.images?.[0]?.url ? (
                                <img src={prod.images[0].url} alt={prod.name} className="w-6 h-6 object-contain rounded" />
                              ) : (
                                <Package className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-xs text-foreground truncate">{prod.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">SKU: {prod.sku || "N/A"} · KES {(prod.price || 0).toLocaleString("en-KE")}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddRelation(prod)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-7 rounded-lg shrink-0"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Link Upsell
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="border-border/60" />

              {/* Active Relations List */}
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                  Active Linked Upsells ({upsellCount})
                </Label>

                {upsellCount === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border/80 rounded-2xl p-4 bg-muted/10">
                    <ArrowUpRight className="h-7 w-7 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-foreground">No upsell alternatives linked yet</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Use the search box above to add premium alternatives.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {relations.filter(r => r.relation_type === 'upsell').map(rel => (
                      <div key={rel.id} className="p-3.5 border border-border/70 bg-card rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0 border border-border/60">
                            {rel.related_product?.image_url ? (
                              <img src={rel.related_product.image_url} alt={rel.related_product.name} className="w-8 h-8 object-contain rounded" />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-foreground truncate">{rel.related_product?.name || "Linked Product"}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              SKU: {rel.related_product?.sku || "N/A"} · Price: KES {(rel.related_product?.price || 0).toLocaleString("en-KE")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {rel.is_bidirectional ? "Bidirectional" : "One-Way"}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRelation(rel.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tab 3: Bundle Package Components */}
          {subTab === 'bundle' && (
            <div className="space-y-6">
              {/* Product Type Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/70 rounded-xl bg-muted/20 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {productType === 'bundle' ? <Box className="h-5 w-5 text-primary" /> : <Package className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Product Architecture: <span className="font-mono uppercase text-primary">{productType}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {productType === 'bundle'
                        ? 'Bundle products contain multiple components sold together at a single bundled price.'
                        : 'Simple products are standalone items with optional cross-sell and upsell recommendations.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    type="button"
                    variant={productType === 'simple' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleProductTypeChange('simple')}
                    className="text-xs rounded-xl h-8"
                  >
                    <Package className="h-3.5 w-3.5 mr-1.5" /> Simple Product
                  </Button>
                  <Button
                    type="button"
                    variant={productType === 'bundle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleProductTypeChange('bundle')}
                    className="text-xs rounded-xl h-8"
                  >
                    <Box className="h-3.5 w-3.5 mr-1.5" /> Bundle Package
                  </Button>
                </div>
              </div>

              {productType === 'bundle' ? (
                <>
                  <Separator className="border-border/60" />

                  {/* Bundle Items List */}
                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider font-semibold text-foreground flex items-center justify-between">
                      <span>Bundle Components ({bundleItems.length})</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        Items included inside this bundle package
                      </span>
                    </Label>

                    {bundleItems.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-border/80 rounded-2xl p-4 bg-muted/10">
                        <Box className="h-7 w-7 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-semibold text-foreground">No bundle components configured</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Search catalog below to add bundled items.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {bundleItems.map((item, index) => (
                          <div key={item.id} className="p-3.5 border border-border/70 bg-card rounded-xl flex items-center justify-between gap-4 shadow-2xs">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">#{index + 1}</span>
                              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0 border border-border/60">
                                {item.component_product?.image_url ? (
                                  <img src={item.component_product.image_url} alt={item.component_product.name} className="w-8 h-8 object-contain rounded" />
                                ) : (
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-xs text-foreground truncate">
                                  {item.component_product?.name || "Component Item"}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  SKU: {item.component_product?.sku || "N/A"} · Price: KES {(item.component_product?.price || 0).toLocaleString("en-KE")}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center gap-2">
                                <Label className="text-[10px] uppercase text-muted-foreground">Optional</Label>
                                <Switch
                                  checked={item.is_optional}
                                  onCheckedChange={(checked) => handleUpdateBundleItem(item.id, { is_optional: checked })}
                                />
                              </div>

                              <Badge variant={item.is_optional ? "outline" : "default"} className="text-[10px]">
                                {item.is_optional ? "Optional" : "Included"}
                              </Badge>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveBundleItem(item.id)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator className="border-border/60" />

                  {/* Add Component Search */}
                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider font-semibold text-foreground">
                      Add Component to Bundle
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search catalog to add bundle component..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                          className="pl-9 text-xs rounded-xl"
                        />
                      </div>
                      <Button type="button" onClick={handleSearch} disabled={searchLoading || !searchQuery.trim()} variant="outline" className="text-xs rounded-xl">
                        {searchLoading ? "Searching..." : "Search"}
                      </Button>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="border border-border/80 rounded-xl p-3 bg-muted/30 space-y-2 mt-2">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Catalog Search Results</p>
                        <div className="space-y-2">
                          {searchResults.map(prod => {
                            const pending = pendingBundleItems[prod.id] || { isOptional: false };
                            return (
                              <div key={prod.id} className="p-3 bg-card rounded-xl border border-border/70 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0 border border-border/60">
                                    {prod.images?.[0]?.url ? (
                                      <img src={prod.images[0].url} alt={prod.name} className="w-6 h-6 object-contain rounded" />
                                    ) : (
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-xs text-foreground truncate">{prod.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono">SKU: {prod.sku || "N/A"} · KES {(prod.price || 0).toLocaleString("en-KE")}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-[10px]">Optional</Label>
                                    <Switch
                                      checked={pending.isOptional}
                                      onCheckedChange={(checked) => setPendingBundleItems(prev => ({
                                        ...prev,
                                        [prod.id]: { isOptional: checked }
                                      }))}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleAddBundleItem(prod, pending.isOptional)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-7 rounded-lg"
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Add Component
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-6 border border-dashed border-border/80 rounded-2xl text-center bg-muted/10 space-y-2">
                  <Package className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-xs font-semibold text-foreground">Standalone Simple Product</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    This item is configured as a standalone product. Switch product architecture above to &quot;Bundle Package&quot; to add bundled component items.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
