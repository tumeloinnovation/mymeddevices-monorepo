"use client";

import React, { useState, useEffect } from "react";
import { Layers, Plus, Trash2, Sparkles, Check, RefreshCw, AlertCircle, Package } from "lucide-react";
import { catalogService, ProductVariant } from "@mymeddevices/shared-core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { Separator } from "../../../ui/separator";

interface StepVariantsProps {
  productId?: string;
  onVariantsUpdated?: (count: number) => void;
}

interface AttributeGroup {
  key: string;
  values: string[];
}

const MEDICAL_PRESETS = [
  {
    name: "Hospital Bed Folds",
    group: { key: "folds", values: ["2-Fold", "3-Fold", "4-Fold", "5-Fold"] }
  },
  {
    name: "Operation Mechanism",
    group: { key: "operation", values: ["Manual", "Electric", "Hydraulic"] }
  },
  {
    name: "Standard Sizing",
    group: { key: "size", values: ["Small", "Medium", "Large", "X-Large"] }
  },
  {
    name: "Frame Material",
    group: { key: "material", values: ["Stainless Steel", "Aluminum Alloy", "ABS Plastic"] }
  }
];

export function StepVariants({ productId, onVariantsUpdated }: StepVariantsProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [groups, setGroups] = useState<AttributeGroup[]>([
    { key: "folds", values: ["2-Fold", "3-Fold", "4-Fold"] }
  ]);
  const [newKey, setNewKey] = useState("");
  const [newValues, setNewValues] = useState("");

  const loadVariants = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await catalogService.getVariants(productId);
      setVariants(data);
      if (onVariantsUpdated) onVariantsUpdated(data.length);
    } catch (err) {
      console.error("Failed to load variants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const addGroup = () => {
    if (!newKey.trim() || !newValues.trim()) return;
    const vals = newValues.split(",").map(v => v.trim()).filter(Boolean);
    if (vals.length === 0) return;

    setGroups(prev => [...prev, { key: newKey.trim().toLowerCase(), values: vals }]);
    setNewKey("");
    setNewValues("");
  };

  const removeGroup = (index: number) => {
    setGroups(prev => prev.filter((_, i) => i !== index));
  };

  const addPreset = (preset: typeof MEDICAL_PRESETS[0]) => {
    const exists = groups.some(g => g.key === preset.group.key);
    if (!exists) {
      setGroups(prev => [...prev, preset.group]);
    }
  };

  const generateMatrix = async () => {
    if (!productId) {
      alert("Please save general details first before creating variants.");
      return;
    }
    if (groups.length === 0) return;

    setGenerating(true);
    try {
      const attrMap: Record<string, string[]> = {};
      groups.forEach(g => {
        attrMap[g.key] = g.values;
      });

      const newVariants = await catalogService.createVariantMatrix(productId, {
        attribute_groups: attrMap,
        default_stock: 10
      });
      setVariants(newVariants);
      if (onVariantsUpdated) onVariantsUpdated(newVariants.length);
    } catch (err: any) {
      console.error("Failed to generate matrix:", err);
      alert(err.message || "Failed to generate variant matrix");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateVariant = async (variantId: string, field: string, value: any) => {
    if (!productId) return;
    try {
      const updated = await catalogService.updateVariant(productId, variantId, { [field]: value });
      setVariants(prev => prev.map(v => v.id === variantId ? updated : v));
    } catch (err) {
      console.error("Failed to update variant:", err);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!productId) return;
    try {
      await catalogService.deleteVariant(productId, variantId);
      setVariants(prev => prev.filter(v => v.id !== variantId));
    } catch (err) {
      console.error("Failed to delete variant:", err);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800 py-3.5 px-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Variant Matrix & Attribute Configurations
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Configure product variations such as fold sections, sizes, mechanisms, and custom attributes.
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {variants.length} Active Variations
          </Badge>
        </CardHeader>
        <CardContent className="p-6 space-y-6">

          {/* Quick Presets Bar */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Medical Preset Attribute Groups
            </Label>
            <div className="flex flex-wrap gap-2">
              {MEDICAL_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addPreset(preset)}
                  className="px-2.5 py-1 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded font-medium text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1"
                >
                  <Plus className="h-3 w-3 text-emerald-600" /> {preset.name}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          {/* Attribute Group Builders */}
          <div className="space-y-4">
            <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
              Active Attribute Groups
            </Label>

            <div className="space-y-2">
              {groups.map((group, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {group.key}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {group.values.map((v, vIdx) => (
                        <Badge key={vIdx} variant="secondary" className="text-[11px] font-normal">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGroup(idx)}
                    className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Custom Group Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <Input
                placeholder="Attribute Name (e.g. size, folds)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="text-xs font-mono"
              />
              <Input
                placeholder="Comma-separated values (e.g. S, M, L)"
                value={newValues}
                onChange={(e) => setNewValues(e.target.value)}
                className="text-xs"
              />
              <Button
                type="button"
                onClick={addGroup}
                variant="outline"
                size="sm"
                className="text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Attribute Group
              </Button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              onClick={generateMatrix}
              disabled={generating || groups.length === 0 || !productId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> Generating Matrix...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-2" /> Generate All Combinations Matrix
                </>
              )}
            </Button>
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          {/* Generated Variant Table */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
              Configured Variant List ({variants.length})
            </Label>

            {variants.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                <Package className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 font-medium">No variants generated yet.</p>
                <p className="text-[11px] text-zinc-400 mt-1">Configure attribute groups above and click "Generate All Combinations Matrix".</p>
              </div>
            ) : (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase text-zinc-600 dark:text-zinc-400">
                    <tr>
                      <th className="p-2.5">Default</th>
                      <th className="p-2.5">Variant Name</th>
                      <th className="p-2.5">SKU</th>
                      <th className="p-2.5">Price Adjustment (±KES)</th>
                      <th className="p-2.5">Override Price (KES)</th>
                      <th className="p-2.5">Stock Qty</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {variants.map((variant) => (
                      <tr key={variant.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <td className="p-2.5 text-center">
                          <input
                            type="radio"
                            name="default_variant"
                            checked={!!variant.is_default}
                            onChange={() => handleUpdateVariant(variant.id, "is_default", true)}
                            className="accent-emerald-600"
                          />
                        </td>
                        <td className="p-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                          {variant.name}
                        </td>
                        <td className="p-2.5 font-mono text-zinc-600 dark:text-zinc-400">
                          <Input
                            defaultValue={variant.sku || ""}
                            onBlur={(e) => handleUpdateVariant(variant.id, "sku", e.target.value)}
                            className="h-7 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2.5">
                          <Input
                            type="number"
                            defaultValue={variant.price_adjustment || 0}
                            onBlur={(e) => handleUpdateVariant(variant.id, "price_adjustment", parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs font-mono w-28"
                          />
                        </td>
                        <td className="p-2.5">
                          <Input
                            type="number"
                            defaultValue={variant.override_price || ""}
                            placeholder="Optional override"
                            onBlur={(e) => handleUpdateVariant(variant.id, "override_price", e.target.value ? parseFloat(e.target.value) : null)}
                            className="h-7 text-xs font-mono w-32"
                          />
                        </td>
                        <td className="p-2.5">
                          <Input
                            type="number"
                            defaultValue={variant.stock_quantity || 0}
                            onBlur={(e) => handleUpdateVariant(variant.id, "stock_quantity", parseInt(e.target.value) || 0)}
                            className="h-7 text-xs font-mono w-20"
                          />
                        </td>
                        <td className="p-2.5 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVariant(variant.id)}
                            className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
