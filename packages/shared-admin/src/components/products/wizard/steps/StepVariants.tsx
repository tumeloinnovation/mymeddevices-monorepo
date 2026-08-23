"use client";

import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import {
  Layers,
  Plus,
  Trash2,
  Star,
  Image as ImageIcon,
  Sparkles,
  Check,
  RotateCcw,
  Boxes,
  ArrowRight,
  SlidersHorizontal,
  Package,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { Switch } from "../../../ui/switch";
import { Popover } from "radix-ui";
import { toast } from "sonner";
import { ProductWizardFormData, WizardVariantItem } from "../product-wizard-schema";

interface StepVariantsProps {
  productId?: string;
  basePrice?: number;
  baseSku?: string;
  imagePreviews?: string[];
}

interface VariantSubOption {
  id: string;
  name: string; // e.g. "Small", "18G", "500ml"
  sku: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  is_active: boolean;
  is_default: boolean;
}

interface VariantGroup {
  id: string;
  groupName: string; // e.g. "Size", "Gauge / Fr", "Volume", "Pack Size"
  options: VariantSubOption[];
}

const MEDICAL_GROUP_PRESETS = [
  { name: "Size", defaults: ["Small", "Medium", "Large"] },
  { name: "Gauge / Fr", defaults: ["18G", "20G", "22G", "24G"] },
  { name: "Volume / Capacity", defaults: ["250ml", "500ml", "1000ml"] },
  { name: "Pack Size", defaults: ["Box of 10", "Box of 50", "Box of 100"] },
  { name: "Sterility", defaults: ["Sterile", "Non-Sterile"] },
  { name: "Voltage", defaults: ["110V", "220V", "Dual Voltage"] },
  { name: "Color", defaults: ["Blue", "Green", "White"] },
  { name: "Material", defaults: ["Latex", "Nitrile", "Silicone"] },
];

export function StepVariants({
  basePrice = 0,
  baseSku = "",
  imagePreviews = [],
}: StepVariantsProps) {
  const { watch, setValue } = useFormContext<ProductWizardFormData>();

  const currentBasePrice = Number(watch("base_price")) || basePrice || 0;
  const currentBaseSku = watch("sku") || baseSku || "SKU";
  const existingFormVariants = watch("variants") || [];

  // Parse or initialize groups
  const [groups, setGroups] = useState<VariantGroup[]>(() => {
    if (existingFormVariants.length > 0) {
      const map = new Map<string, VariantSubOption[]>();
      existingFormVariants.forEach((v) => {
        let groupKey = "Option";
        let optName = v.name;

        if (v.attributes && Object.keys(v.attributes).length > 0) {
          groupKey = Object.keys(v.attributes)[0];
          optName = v.attributes[groupKey] || v.name;
        } else if (v.name.includes(":")) {
          const parts = v.name.split(":");
          groupKey = parts[0].trim();
          optName = parts.slice(1).join(":").trim();
        }

        const capGroup = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
        if (!map.has(capGroup)) {
          map.set(capGroup, []);
        }
        map.get(capGroup)!.push({
          id: v.id || `opt-${Math.random()}`,
          name: optName,
          sku: v.sku || "",
          price: v.price ?? currentBasePrice,
          stock_quantity: v.stock_quantity ?? 10,
          image_url: v.image_url || "",
          is_active: v.is_active ?? true,
          is_default: v.is_default ?? false,
        });
      });

      return Array.from(map.entries()).map(([gName, opts], idx) => ({
        id: `grp-${Date.now()}-${idx}`,
        groupName: gName,
        options: opts,
      }));
    }

    // Default template: Size -> Small, Medium, Large
    return [
      {
        id: `grp-${Date.now()}-1`,
        groupName: "Size",
        options: [
          {
            id: `opt-${Date.now()}-1`,
            name: "Small",
            sku: currentBaseSku ? `${currentBaseSku}-SM` : "SKU-SM",
            price: currentBasePrice,
            stock_quantity: 10,
            image_url: imagePreviews?.[0] || "",
            is_active: true,
            is_default: true,
          },
          {
            id: `opt-${Date.now()}-2`,
            name: "Medium",
            sku: currentBaseSku ? `${currentBaseSku}-MD` : "SKU-MD",
            price: currentBasePrice,
            stock_quantity: 10,
            image_url: imagePreviews?.[0] || "",
            is_active: true,
            is_default: false,
          },
          {
            id: `opt-${Date.now()}-3`,
            name: "Large",
            sku: currentBaseSku ? `${currentBaseSku}-LG` : "SKU-LG",
            price: currentBasePrice,
            stock_quantity: 10,
            image_url: imagePreviews?.[0] || "",
            is_active: true,
            is_default: false,
          },
        ],
      },
    ];
  });

  const [newGroupName, setNewGroupName] = useState("");
  const [quickInputMap, setQuickInputMap] = useState<Record<string, string>>({});
  const [showBatchBar, setShowBatchBar] = useState<string | null>(null);

  // Sync groups state into form's flattened `variants` array
  const syncToForm = (updatedGroups: VariantGroup[]) => {
    const flattened: WizardVariantItem[] = updatedGroups.flatMap((grp) =>
      grp.options.map((opt) => ({
        id: opt.id,
        name: `${grp.groupName}: ${opt.name}`,
        sku: opt.sku,
        price: opt.price,
        stock_quantity: opt.stock_quantity,
        attributes: { [grp.groupName.toLowerCase()]: opt.name },
        is_active: opt.is_active,
        is_default: opt.is_default,
        image_url: opt.image_url,
      }))
    );
    setValue("variants", flattened, { shouldValidate: true, shouldDirty: true });
  };

  // Run sync on mount if not synced
  useEffect(() => {
    syncToForm(groups);
  }, []);

  // Add a new Group
  const handleAddGroup = (nameToAdd?: string, defaultValues?: string[]) => {
    const name = (nameToAdd || newGroupName).trim();
    if (!name) {
      toast.error("Please enter a variant group name (e.g. Size, Gauge, Pack Size).");
      return;
    }

    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    if (groups.some((g) => g.groupName.toLowerCase() === formattedName.toLowerCase())) {
      toast.error(`Variant group "${formattedName}" already exists.`);
      return;
    }

    const optsToAdd = defaultValues && defaultValues.length > 0 ? defaultValues : ["Standard"];

    const newGroup: VariantGroup = {
      id: `grp-${Date.now()}`,
      groupName: formattedName,
      options: optsToAdd.map((val, idx) => ({
        id: `opt-${Date.now()}-${idx + 1}`,
        name: val,
        sku: currentBaseSku ? `${currentBaseSku}-${formattedName.slice(0, 3).toUpperCase()}-${idx + 1}` : `SKU-${idx + 1}`,
        price: currentBasePrice,
        stock_quantity: 10,
        image_url: imagePreviews?.[0] || "",
        is_active: true,
        is_default: groups.length === 0 && idx === 0,
      })),
    };

    const updated = [...groups, newGroup];
    setGroups(updated);
    syncToForm(updated);
    setNewGroupName("");
    toast.success(`Added "${formattedName}" with ${newGroup.options.length} options.`);
  };

  // Remove a Group
  const handleRemoveGroup = (groupId: string) => {
    const updated = groups.filter((g) => g.id !== groupId);
    setGroups(updated);
    syncToForm(updated);
    toast.info("Variant group removed.");
  };

  // Rename a Group
  const handleRenameGroup = (groupId: string, newName: string) => {
    const updated = groups.map((g) => (g.id === groupId ? { ...g, groupName: newName } : g));
    setGroups(updated);
    syncToForm(updated);
  };

  // Add Single Option to Group
  const handleAddOption = (groupId: string, optionName = "") => {
    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;
      const count = g.options.length + 1;
      const cleanName = optionName.trim();
      const code = cleanName ? cleanName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() : `${count}`;
      const newOption: VariantSubOption = {
        id: `opt-${Date.now()}-${count}`,
        name: cleanName,
        sku: currentBaseSku ? `${currentBaseSku}-${g.groupName.slice(0, 3).toUpperCase()}-${code}` : `SKU-${code}`,
        price: currentBasePrice,
        stock_quantity: 10,
        image_url: imagePreviews?.[0] || "",
        is_active: true,
        is_default: g.options.length === 0,
      };
      return { ...g, options: [...g.options, newOption] };
    });
    setGroups(updated);
    syncToForm(updated);
  };

  // Quick batch add multiple comma-separated or Enter options
  const handleQuickAddOptions = (groupId: string) => {
    const text = quickInputMap[groupId]?.trim();
    if (!text) return;

    const rawValues = text.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    if (rawValues.length === 0) return;

    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;
      const existingNames = new Set(g.options.map((o) => o.name.toLowerCase()));
      const newItems: VariantSubOption[] = [];

      rawValues.forEach((val, idx) => {
        if (!existingNames.has(val.toLowerCase())) {
          existingNames.add(val.toLowerCase());
          const count = g.options.length + newItems.length + 1;
          const code = val.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || `${count}`;
          newItems.push({
            id: `opt-${Date.now()}-${count}-${idx}`,
            name: val,
            sku: currentBaseSku ? `${currentBaseSku}-${g.groupName.slice(0, 3).toUpperCase()}-${code}` : `SKU-${code}`,
            price: currentBasePrice,
            stock_quantity: 10,
            image_url: imagePreviews?.[0] || "",
            is_active: true,
            is_default: g.options.length === 0 && newItems.length === 0,
          });
        }
      });

      return { ...g, options: [...g.options, ...newItems] };
    });

    setGroups(updated);
    syncToForm(updated);
    setQuickInputMap((prev) => ({ ...prev, [groupId]: "" }));
    toast.success(`Added ${rawValues.length} option(s)`);
  };

  // Remove Option from Group
  const handleRemoveOption = (groupId: string, optionId: string) => {
    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;
      const remaining = g.options.filter((o) => o.id !== optionId);
      // Ensure at least one is default if there are remaining
      if (remaining.length > 0 && !remaining.some((o) => o.is_default)) {
        remaining[0].is_default = true;
      }
      return { ...g, options: remaining };
    });
    setGroups(updated);
    syncToForm(updated);
  };

  // Update Option field
  const handleUpdateOption = (
    groupId: string,
    optionId: string,
    field: keyof VariantSubOption,
    val: any
  ) => {
    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        options: g.options.map((o) => {
          if (o.id !== optionId) {
            // If setting is_default to true, unset on all other options across all groups
            if (field === "is_default" && val === true) {
              return { ...o, is_default: false };
            }
            return o;
          }
          return { ...o, [field]: val };
        }),
      };
    });
    setGroups(updated);
    syncToForm(updated);
  };

  // Batch Update all options in a group (e.g. Set all prices or all stock)
  const handleBatchUpdateGroup = (groupId: string, field: "price" | "stock_quantity", value: number) => {
    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        options: g.options.map((o) => ({ ...o, [field]: value })),
      };
    });
    setGroups(updated);
    syncToForm(updated);
    toast.success(`Updated ${field === "price" ? "price" : "stock"} for all options in group.`);
  };

  // Calculate Metrics
  const totalOptionsCount = groups.reduce((acc, g) => acc + g.options.length, 0);
  const totalStockCount = groups.reduce((acc, g) => acc + g.options.reduce((s, o) => s + (o.is_active ? Number(o.stock_quantity || 0) : 0), 0), 0);
  const prices = groups.flatMap((g) => g.options.map((o) => Number(o.price || 0))).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : currentBasePrice;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : currentBasePrice;

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Bar */}
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950 shadow-xs">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 py-4 px-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Product Variants
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Define product variations (e.g. Size, Gauge, Pack Size) with independent SKU identifiers, storefront prices, and inventory stock.
            </CardDescription>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-zinc-500 font-medium">Total Variants:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{totalOptionsCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center gap-1.5">
              <Boxes className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-zinc-500 font-medium">Total Stock:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{totalStockCount} units</span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
              <span className="font-semibold font-mono">
                {minPrice === maxPrice
                  ? `KES ${minPrice.toLocaleString()}`
                  : `KES ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`}
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Quick Add Presets Section */}
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Quick-Add Medical & Equipment Presets:
              </Label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {MEDICAL_GROUP_PRESETS.map((preset) => {
                const isAdded = groups.some((g) => g.groupName.toLowerCase() === preset.name.toLowerCase());
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleAddGroup(preset.name, preset.defaults)}
                    disabled={isAdded}
                    className={`text-xs px-2.5 py-1.5 rounded-md border transition-all flex items-center gap-1.5 font-medium ${
                      isAdded
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-not-allowed opacity-60"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {isAdded ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Plus className="h-3 w-3 text-emerald-600" />
                    )}
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Group Adder */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              placeholder="Custom variant group name (e.g. Needle Gauge, Electrode Type, Shaft Length)..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddGroup();
                }
              }}
              className="h-8.5 text-xs bg-white dark:bg-zinc-950 flex-1"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => handleAddGroup()}
              className="h-8.5 text-xs font-semibold shrink-0 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Custom Group
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Group Cards List */}
      {groups.length === 0 ? (
        <div className="p-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center space-y-3 bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              No variant groups added
            </p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              If this product is sold in different sizes, volumes, or configurations, select a preset above or add a custom variant group.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group, groupIdx) => {
            const isBatchOpen = showBatchBar === group.id;

            return (
              <Card
                key={group.id}
                className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950 shadow-xs overflow-hidden"
              >
                {/* Group Header */}
                <CardHeader className="bg-zinc-50/90 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs">
                      {groupIdx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Group:</Label>
                      <Input
                        value={group.groupName}
                        onChange={(e) => handleRenameGroup(group.id, e.target.value)}
                        className="h-7.5 text-xs font-semibold w-40 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
                      />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono text-zinc-500 bg-white dark:bg-zinc-900">
                      {group.options.length} {group.options.length === 1 ? "Option" : "Options"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBatchBar(isBatchOpen ? null : group.id)}
                      className={`h-7.5 text-xs font-semibold ${isBatchOpen ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
                    >
                      <SlidersHorizontal className="h-3 w-3 mr-1 text-zinc-500" />
                      Batch Tools
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddOption(group.id)}
                      className="h-7.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    >
                      <Plus className="h-3 w-3 mr-1 text-emerald-600" /> Add Option
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveGroup(group.id)}
                      className="h-7.5 w-7.5 text-zinc-400 hover:text-destructive"
                      title="Delete this entire group"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                {/* Batch Actions Bar */}
                {isBatchOpen && (
                  <div className="p-3 bg-zinc-100/70 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" /> Quick Apply to all &quot;{group.groupName}&quot; variants:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleBatchUpdateGroup(group.id, "price", currentBasePrice)}
                        className="h-7 text-xs font-medium bg-white dark:bg-zinc-800 border"
                      >
                        Reset Price to Base (KES {currentBasePrice.toLocaleString()})
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleBatchUpdateGroup(group.id, "stock_quantity", 10)}
                        className="h-7 text-xs font-medium bg-white dark:bg-zinc-800 border"
                      >
                        Set All Stock to 10
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleBatchUpdateGroup(group.id, "stock_quantity", 50)}
                        className="h-7 text-xs font-medium bg-white dark:bg-zinc-800 border"
                      >
                        Set All Stock to 50
                      </Button>
                    </div>
                  </div>
                )}

                {/* Quick Add Pill Input Bar */}
                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 font-medium whitespace-nowrap">Fast Add Options:</span>
                  <Input
                    placeholder={`Type options separated by commas (e.g. ${
                      group.groupName === "Size"
                        ? "XS, Small, Medium, Large, XL"
                        : group.groupName === "Pack Size"
                        ? "Single, Box of 10, Box of 50"
                        : "Option 1, Option 2, Option 3"
                    }) then press Enter...`}
                    value={quickInputMap[group.id] || ""}
                    onChange={(e) => setQuickInputMap((prev) => ({ ...prev, [group.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleQuickAddOptions(group.id);
                      }
                    }}
                    className="h-7.5 text-xs bg-white dark:bg-zinc-950 flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickAddOptions(group.id)}
                    className="h-7.5 text-xs font-medium shrink-0"
                  >
                    Add
                  </Button>
                </div>

                {/* Sub-Options Table */}
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-10 text-center" title="Primary display variant">Def</th>
                          <th className="py-2.5 px-3 w-16 text-center">Photo</th>
                          <th className="py-2.5 px-3 min-w-[160px]">
                            {group.groupName ? `${group.groupName} Value` : "Option Value"} *
                          </th>
                          <th className="py-2.5 px-3 min-w-[140px]">SKU *</th>
                          <th className="py-2.5 px-3 min-w-[130px]">Price (KES) *</th>
                          <th className="py-2.5 px-3 w-28">Stock *</th>
                          <th className="py-2.5 px-3 w-16 text-center">Active</th>
                          <th className="py-2.5 px-3 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                        {group.options.map((option) => (
                          <tr
                            key={option.id}
                            className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30 transition-colors ${
                              !option.is_active ? "opacity-50 bg-zinc-50/40 dark:bg-zinc-900/10" : ""
                            }`}
                          >
                            {/* Default Star Radio */}
                            <td className="py-2 px-3 text-center align-middle">
                              <button
                                type="button"
                                onClick={() => handleUpdateOption(group.id, option.id, "is_default", true)}
                                title={option.is_default ? "Primary display variant" : "Click to set as default variant"}
                                className={`p-1 rounded-md transition-colors ${
                                  option.is_default
                                    ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
                                    : "text-zinc-300 hover:text-zinc-500"
                                }`}
                              >
                                <Star className={`h-4 w-4 ${option.is_default ? "fill-amber-500" : ""}`} />
                              </button>
                            </td>

                            {/* Image Thumbnail Picker */}
                            <td className="py-2 px-3 text-center align-middle">
                              <Popover.Root>
                                <Popover.Trigger asChild>
                                  <button
                                    type="button"
                                    title="Pick photo for this variant"
                                    className="h-8.5 w-8.5 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 hover:border-zinc-400 transition-colors relative mx-auto"
                                  >
                                    {option.image_url ? (
                                      <img
                                        src={option.image_url}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <ImageIcon className="h-4 w-4 text-zinc-400" />
                                    )}
                                  </button>
                                </Popover.Trigger>
                                <Popover.Portal>
                                  <Popover.Content
                                    align="start"
                                    sideOffset={4}
                                    className="z-50 w-64 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 shadow-xl space-y-3"
                                  >
                                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                      Assign Variant Photo
                                    </div>
                                    {imagePreviews.length > 0 ? (
                                      <div className="grid grid-cols-4 gap-1.5">
                                        {imagePreviews.map((imgUrl) => (
                                          <button
                                            key={imgUrl}
                                            type="button"
                                            onClick={() =>
                                              handleUpdateOption(group.id, option.id, "image_url", imgUrl)
                                            }
                                            className={`h-12 w-12 rounded-lg border overflow-hidden ${
                                              option.image_url === imgUrl
                                                ? "border-emerald-500 ring-2 ring-emerald-500/30"
                                                : "border-zinc-200 dark:border-zinc-800 hover:opacity-80"
                                            }`}
                                          >
                                            <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-zinc-500">
                                        Upload images in Step 5 (Clinical Gallery) to select photos.
                                      </p>
                                    )}
                                    <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                                      <Label className="text-[10px] text-zinc-500 uppercase font-semibold">
                                        Or External Image URL
                                      </Label>
                                      <Input
                                        placeholder="https://..."
                                        value={option.image_url || ""}
                                        onChange={(e) =>
                                          handleUpdateOption(group.id, option.id, "image_url", e.target.value)
                                        }
                                        className="h-7 text-xs"
                                      />
                                    </div>
                                  </Popover.Content>
                                </Popover.Portal>
                              </Popover.Root>
                            </td>

                            {/* Sub-option Name (e.g. Small, Medium, 18G) */}
                            <td className="py-2 px-3 align-middle">
                              <Input
                                value={option.name}
                                onChange={(e) =>
                                  handleUpdateOption(group.id, option.id, "name", e.target.value)
                                }
                                placeholder={`e.g. ${
                                  group.groupName === "Size"
                                    ? "Large"
                                    : group.groupName === "Gauge / Fr"
                                    ? "20G"
                                    : "Option Name"
                                }`}
                                className="h-8 text-xs bg-white dark:bg-zinc-950 font-semibold"
                              />
                            </td>

                            {/* SKU */}
                            <td className="py-2 px-3 align-middle">
                              <Input
                                value={option.sku}
                                onChange={(e) =>
                                  handleUpdateOption(group.id, option.id, "sku", e.target.value)
                                }
                                placeholder="SKU"
                                className="h-8 text-xs font-mono bg-white dark:bg-zinc-950"
                              />
                            </td>

                            {/* Price */}
                            <td className="py-2 px-3 align-middle">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-semibold">
                                  KES
                                </span>
                                <Input
                                  type="number"
                                  value={option.price}
                                  onChange={(e) =>
                                    handleUpdateOption(
                                      group.id,
                                      option.id,
                                      "price",
                                      Number(e.target.value) || 0
                                    )
                                  }
                                  placeholder="0"
                                  className="h-8 text-xs font-semibold pl-10 bg-white dark:bg-zinc-950 font-mono"
                                />
                              </div>
                            </td>

                            {/* Quantity / Stock */}
                            <td className="py-2 px-3 align-middle">
                              <Input
                                type="number"
                                value={option.stock_quantity}
                                onChange={(e) =>
                                  handleUpdateOption(
                                    group.id,
                                    option.id,
                                    "stock_quantity",
                                    Number(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                                className="h-8 text-xs font-mono bg-white dark:bg-zinc-950"
                              />
                            </td>

                            {/* Active Switch */}
                            <td className="py-2 px-3 text-center align-middle">
                              <Switch
                                checked={option.is_active}
                                onCheckedChange={(checked) =>
                                  handleUpdateOption(group.id, option.id, "is_active", checked)
                                }
                              />
                            </td>

                            {/* Delete Option Button */}
                            <td className="py-2 px-3 text-center align-middle">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleRemoveOption(group.id, option.id)}
                                className="h-7 w-7 text-zinc-400 hover:text-destructive"
                                title="Delete option"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Add Option Row */}
                  <div className="p-2.5 bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddOption(group.id)}
                      className="h-7 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Another &quot;{group.groupName || "Option"}&quot;
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
