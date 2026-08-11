"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Package, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Badge } from "../../../ui/badge";
import { Switch } from "../../../ui/switch";
import { Separator } from "../../../ui/separator";
import { ProductWizardFormData } from "../product-wizard-schema";
import { useProductWizardStore } from "../use-product-wizard-store";
import { StepVariants } from "./StepVariants";
import { StepBundle } from "./StepBundle";

export function StepInventory() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ProductWizardFormData>();
  const { draftProductId } = useProductWizardStore();

  const stockStatusVal = watch("stock_status") || "instock";
  const brandName = watch("brand_name") || "MED";
  const categoryName = watch("category_name") || "DEV";

  const handleAutoGenerateSku = () => {
    const brandPart = brandName.substring(0, 3).toUpperCase();
    const catPart = categoryName.substring(0, 3).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setValue("sku", `${brandPart}-${catPart}-${rand}`, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800 py-3.5 px-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <Package className="h-4 w-4 text-zinc-500" /> Inventory & Logistics Configuration
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Stock availability status, inventory count, SKU identifiers, shipping weight, and parcel dimensions
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] uppercase">Step 3 of 6</Badge>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
              Stock Availability Status
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: "instock", label: "In Stock", icon: "✓", desc: "Available for immediate order" },
                { value: "outofstock", label: "Out of Stock", icon: "✕", desc: "Temporarily unavailable" },
                { value: "backorder", label: "Backorder", icon: "⏳", desc: "Orders accepted, delayed delivery" },
                { value: "ondemand", label: "On Demand", icon: "◉", desc: "Special manufacturing order" },
              ].map((st) => {
                const isSelected = stockStatusVal === st.value;
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setValue("stock_status", st.value, { shouldValidate: true })}
                    className={`flex flex-col items-center gap-1 p-2.5 border rounded-lg transition-all text-center ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-950/30"
                        : "bg-white border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                    }`}
                  >
                    <span className={`text-sm font-bold ${isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}`}>
                      {st.icon} {st.label}
                    </span>
                    <span className={`text-[8px] leading-tight ${isSelected ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-400"}`}>
                      {st.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="stock_quantity" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                Initial Available Stock Quantity <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                max="1000000"
                {...register("stock_quantity")}
                placeholder="0"
                className="font-mono text-xs border-zinc-300 dark:border-zinc-700"
              />
              {errors.stock_quantity && (
                <p className="text-[10px] text-rose-500">{errors.stock_quantity.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="low_stock_threshold" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                Low Stock Reorder Alert Threshold
              </Label>
              <Input
                id="low_stock_threshold"
                type="number"
                min="0"
                max="1000000"
                {...register("low_stock_threshold")}
                placeholder="5"
                className="font-mono text-xs border-zinc-300 dark:border-zinc-700"
              />
            </div>
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="sku" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                  Stock Keeping Unit (SKU) <span className="text-rose-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={handleAutoGenerateSku}
                  className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Auto-generate SKU
                </button>
              </div>
              <Input
                id="sku"
                {...register("sku")}
                placeholder="e.g. VOL-ULT-8842"
                className="font-mono text-xs border-zinc-300 dark:border-zinc-700"
              />
              {errors.sku && (
                <p className="text-[10px] text-rose-500">{errors.sku.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="weight_kg" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                Parcel Shipping Weight (Kilograms)
              </Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.01"
                min="0.01"
                max="500"
                {...register("weight_kg")}
                placeholder="e.g. 14.5"
                className="font-mono text-xs border-zinc-300 dark:border-zinc-700"
              />
            </div>
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
              Parcel Dimensions (Centimeters)
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="length_cm" className="text-[10px] uppercase font-semibold text-zinc-600 dark:text-zinc-400">Length (cm)</Label>
                <Input id="length_cm" type="number" min="1" max="300" {...register("length_cm")} placeholder="e.g. 45" className="font-mono text-xs border-zinc-300 dark:border-zinc-700" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="width_cm" className="text-[10px] uppercase font-semibold text-zinc-600 dark:text-zinc-400">Width (cm)</Label>
                <Input id="width_cm" type="number" min="1" max="300" {...register("width_cm")} placeholder="e.g. 30" className="font-mono text-xs border-zinc-300 dark:border-zinc-700" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="height_cm" className="text-[10px] uppercase font-semibold text-zinc-600 dark:text-zinc-400">Height (cm)</Label>
                <Input id="height_cm" type="number" min="1" max="300" {...register("height_cm")} placeholder="e.g. 18" className="font-mono text-xs border-zinc-300 dark:border-zinc-700" />
              </div>
            </div>
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          <div className="flex items-center justify-between py-2 px-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 block">
                Automatic Inventory Tracking
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Deduct available stock automatically as customer purchases are completed
              </span>
            </div>
            <Switch
              checked={watch("track_inventory") ?? true}
              onCheckedChange={(checked: boolean) => setValue("track_inventory", checked, { shouldValidate: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Conditionally render Variant Matrix Generator or Bundle Component Builder */}
      {watch("product_type") === "variable" && (
        <StepVariants productId={draftProductId || undefined} />
      )}
      {watch("product_type") === "bundle" && (
        <StepBundle productId={draftProductId || undefined} />
      )}
    </div>
  );
}
