"use client";

import React, { useState, useEffect } from "react";
import { Link2, Search, Plus, Trash2, Package, ArrowUpRight, Shield, Layers, HelpCircle } from "lucide-react";
import { catalogService, RelatedProduct, Product, RelationType } from "@mymeddevices/shared-core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface RelatedProductsEditorProps {
  productId: string;
}

const RELATION_TYPES: { type: RelationType; title: string; desc: string; bidirectionalDefault: boolean }[] = [
  {
    type: "accessory",
    title: "Compatible Accessories",
    desc: "Test strips, probes, sensors, cuffs, or add-ons meant to work with this device.",
    bidirectionalDefault: true
  },
  {
    type: "spare_part",
    title: "Spare Parts & Replacements",
    desc: "Replacement batteries, cables, filters, or maintenance components.",
    bidirectionalDefault: true
  },
  {
    type: "cross_sell",
    title: "Cross-Sell Items (Frequently Bought Together)",
    desc: "Complementary clinical products commonly purchased alongside this device.",
    bidirectionalDefault: true
  },
  {
    type: "upsell",
    title: "Upsell Alternatives (Upgrade Options)",
    desc: "Higher-tier models or upgraded configurations recommended to buyers.",
    bidirectionalDefault: false
  }
];

export function RelatedProductsEditor({ productId }: RelatedProductsEditorProps) {
  const [relations, setRelations] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<RelationType>("accessory");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

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

  useEffect(() => {
    loadRelations();
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
      setSearchResults((resp.products || []).filter(p => p.id !== productId));
    } catch (err) {
      console.error("Failed to search products:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddRelation = async (targetProduct: Product) => {
    const config = RELATION_TYPES.find(r => r.type === activeType);
    const isBidi = config ? config.bidirectionalDefault : true;

    try {
      const rel = await catalogService.addRelatedProduct(productId, {
        related_product_id: targetProduct.id,
        relation_type: activeType,
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

  return (
    <div className="space-y-6">
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <CardHeader className="py-4 px-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Related Product & Cross-Sell Manager
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">
              {relations.length} Total Links
            </Badge>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Link compatible accessories, replacement parts, cross-sells, and upgrade recommendations for this device.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Relation Type Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {RELATION_TYPES.map(rel => {
              const count = relations.filter(r => r.relation_type === rel.type).length;
              const isSelected = activeType === rel.type;
              return (
                <button
                  key={rel.type}
                  type="button"
                  onClick={() => setActiveType(rel.type)}
                  className={`p-3 text-left border rounded-lg transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{rel.title.split(" ")[0]}</span>
                    <Badge variant={isSelected ? "default" : "secondary"} className="text-[10px] font-mono">
                      {count}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-zinc-500 line-clamp-1 mt-1">{rel.desc}</p>
                </button>
              );
            })}
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          {/* Search to Link */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Link Product as <strong className="text-emerald-600 font-mono uppercase">{activeType}</strong></span>
              <span className="text-[10px] text-zinc-400 font-normal">
                {RELATION_TYPES.find(r => r.type === activeType)?.desc}
              </span>
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder={`Search catalog to add ${activeType}...`}
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
              Active Linked Products for {activeType.toUpperCase()} ({relations.filter(r => r.relation_type === activeType).length})
            </Label>

            {relations.filter(r => r.relation_type === activeType).length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <Package className="h-6 w-6 text-zinc-400 mx-auto mb-1" />
                <p className="text-xs text-zinc-500 font-medium">No {activeType} products linked.</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Use the search box above to search and link related products.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {relations.filter(r => r.relation_type === activeType).map(rel => (
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
        </CardContent>
      </Card>
    </div>
  );
}
