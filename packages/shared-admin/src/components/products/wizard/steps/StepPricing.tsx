"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { ShoppingCart, Tag as TagIcon, AlertCircle, Calendar, Sparkles, TrendingDown } from "lucide-react";
import { calculatePlatformPricing } from "@mymeddevices/shared-core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Badge } from "../../../ui/badge";
import { Switch } from "../../../ui/switch";
import { Separator } from "../../../ui/separator";
import { Button } from "../../../ui/button";
import { ProductWizardFormData } from "../product-wizard-schema";

export function StepPricing() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ProductWizardFormData>();

  const basePriceVal = Number(watch("base_price")) || 0;
  const costPriceVal = Number(watch("cost_price")) || 0;

  const saleActive = watch("sale_active") ?? false;
  const compareAtPrice = watch("compare_at_price");
  const saleEndDate = watch("sale_end_date");

  const platformPricing = calculatePlatformPricing(basePriceVal, costPriceVal);
  const isLoss = platformPricing.sellerProfit < 0;

  const regularCustomerPrice = platformPricing.customerPrice;
  const compareAtPriceNum = saleActive && compareAtPrice ? Number(compareAtPrice) : 0;

  // Calculate promotional savings if compareAtPrice is provided
  const hasValidDiscount = compareAtPriceNum > regularCustomerPrice;
  const discountAmount = hasValidDiscount ? compareAtPriceNum - regularCustomerPrice : 0;
  const discountPercent = hasValidDiscount ? Math.round((discountAmount / compareAtPriceNum) * 100) : 0;

  const handleQuickDuration = (days: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    setValue("sale_end_date", targetDate.toISOString().split("T")[0], { shouldValidate: true });
  };

  const handleEndOfMonth = () => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setValue("sale_end_date", endOfMonth.toISOString().split("T")[0], { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800 py-3.5 px-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Financial & Platform Pricing (KES)
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Configure net vendor payout; platform marketplace markup and customer storefront price calculate automatically
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] uppercase">Step 2 of 7</Badge>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="base_price" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                  Seller Base Payout Price (KES) <span className="text-rose-500">*</span>
                </Label>
                <span className="text-[9px] font-mono text-zinc-400">Min: KES 1 | Max: KES 100M</span>
              </div>
              <Input
                id="base_price"
                type="number"
                min="1"
                max="100000000"
                {...register("base_price")}
                placeholder="e.g. 150000"
                className="font-mono text-base font-bold border-zinc-300 dark:border-zinc-700"
              />
              {errors.base_price && (
                <p className="text-[10px] text-rose-500">{errors.base_price.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wholesale_price" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                Cost / Wholesale COGS Price (KES)
              </Label>
              <Input
                id="wholesale_price"
                type="number"
                min="0"
                max="100000000"
                {...register("wholesale_price")}
                placeholder="e.g. 100000"
                className="font-mono text-base border-zinc-300 dark:border-zinc-700"
              />
              <p className="text-[10px] text-zinc-400">Internal unit manufacturing or supply procurement cost (optional)</p>
            </div>
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          {/* Redesigned Promotional / Sale Price Section with Warm Orange Accent */}
          <div className="space-y-4 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-5 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs uppercase tracking-wider font-bold text-amber-950 dark:text-amber-200">
                    Promotional & Sale Price Configuration
                  </span>
                  {saleActive && (
                    <Badge className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-mono px-2 py-0.5">
                      PROMO ACTIVE
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Highlight discounted promotion on storefront listings with strike-through compare-at prices
                </p>
              </div>
              <Switch
                checked={saleActive}
                onCheckedChange={(checked: boolean) => setValue("sale_active", checked, { shouldValidate: true })}
              />
            </div>

            {saleActive && (
              <div className="space-y-4 pt-4 border-t border-amber-200/80 dark:border-amber-900/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="compare_at_price" className="text-xs uppercase tracking-wider font-semibold text-amber-900 dark:text-amber-300">
                        Regular / Compare-At Price (KES)
                      </Label>
                      {hasValidDiscount && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <TrendingDown className="h-3.5 w-3.5" /> {discountPercent}% OFF
                        </span>
                      )}
                    </div>
                    <Input
                      id="compare_at_price"
                      type="number"
                      min="1"
                      max="100000000"
                      {...register("compare_at_price")}
                      placeholder={`e.g. ${regularCustomerPrice ? Math.round(regularCustomerPrice * 1.25) : 180000}`}
                      className="font-mono text-base font-bold border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-900 focus-visible:ring-amber-500"
                    />
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Original catalog benchmark / MSRP price shown crossed out (~~KES {compareAtPriceNum || "0"}~~)
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sale_end_date" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Promotion Expiration Date
                      </Label>
                      <span className="text-[10px] text-zinc-400">Optional countdown</span>
                    </div>
                    <Input
                      id="sale_end_date"
                      type="date"
                      {...register("sale_end_date")}
                      className="font-mono text-xs border-amber-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-visible:ring-amber-500"
                    />
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-zinc-400 font-medium">Quick:</span>
                      <button
                        type="button"
                        onClick={() => handleQuickDuration(7)}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100/70 hover:bg-amber-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-amber-900 dark:text-zinc-300 transition-colors"
                      >
                        +7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDuration(14)}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100/70 hover:bg-amber-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-amber-900 dark:text-zinc-300 transition-colors"
                      >
                        +14 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDuration(30)}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100/70 hover:bg-amber-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-amber-900 dark:text-zinc-300 transition-colors"
                      >
                        +30 Days
                      </button>
                      <button
                        type="button"
                        onClick={handleEndOfMonth}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100/70 hover:bg-amber-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-amber-900 dark:text-zinc-300 transition-colors"
                      >
                        Month End
                      </button>
                    </div>
                  </div>
                </div>

                {compareAtPriceNum > 0 && (
                  <div className="p-4 rounded-lg border border-amber-300 dark:border-amber-800/60 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Storefront Display Preview:</span>
                        {hasValidDiscount ? (
                          <Badge className="bg-emerald-600 text-white text-[10px] font-bold font-mono">
                            SAVE KES {discountAmount.toLocaleString()} ({discountPercent}%)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-400 text-[10px]">
                            Compare price should be higher than customer price (KES {regularCustomerPrice.toLocaleString()})
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {saleEndDate ? `Promotion active until ${new Date(saleEndDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}` : "Ongoing promotion without fixed expiration"}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs text-zinc-400 line-through mr-2">
                        KES {compareAtPriceNum.toLocaleString()}
                      </span>
                      <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                        KES {regularCustomerPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {basePriceVal > 0 && (
            <div className="border-2 border-zinc-800 dark:border-zinc-200 bg-zinc-50 dark:bg-zinc-900 p-5 space-y-4 font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-300 dark:border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Platform Storefront Price Breakdown
                </span>
                <Badge className="bg-emerald-600 text-white text-[10px] font-mono font-bold">
                  Fees based on {costPriceVal > 0 ? "Cost Price" : "Seller Base Price"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-medium">1. Base Payout Price</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-base mt-1 block">
                    KES {basePriceVal.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-zinc-400 block mt-1">Net amount vendor receives</span>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <span className="text-amber-700 dark:text-amber-300 block text-[10px] uppercase font-medium">
                    2. Platform Markup ({platformPricing.markupPercent}%)
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-base mt-1 block">
                    + KES {platformPricing.markupAmount.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-amber-600/70 block mt-1">Marketplace margin</span>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <span className="text-blue-700 dark:text-blue-300 block text-[10px] uppercase font-medium">
                    3. Commission Fee ({platformPricing.commissionPercent}%)
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-base mt-1 block">
                    + KES {platformPricing.commissionAmount.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-blue-600/70 block mt-1">Transaction & escrow fee</span>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-600 dark:border-emerald-400 sm:col-span-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-emerald-800 dark:text-emerald-300 block text-[10px] uppercase font-bold">
                        Final Storefront Customer Price
                      </span>
                      <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 block mt-0.5">
                        Published listing price charged to healthcare facilities and buyers
                      </span>
                    </div>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xl block font-mono">
                      KES {regularCustomerPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {costPriceVal > 0 && isLoss && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-rose-800 dark:text-rose-300 block">Warning: Cost exceeds seller payout</span>
                    <span className="text-rose-600 dark:text-rose-400 block text-[11px]">
                      Vendor will lose KES {Math.abs(platformPricing.sellerProfit).toLocaleString()} per unit sold.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
