"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { ShoppingCart, Percent, Tag as TagIcon, AlertCircle } from "lucide-react";
import { calculatePlatformPricing } from "@mymeddevices/shared-core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Badge } from "../../../ui/badge";
import { Switch } from "../../../ui/switch";
import { Separator } from "../../../ui/separator";
import { ProductWizardFormData } from "../product-wizard-schema";

export function StepPricing() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ProductWizardFormData>();

  const vendorPayoutVal = Number(watch("vendor_payout")) || 0;
  const wholesalePriceVal = Number(watch("wholesale_price")) || 0;
  const vatRate = watch("vat_rate") ?? 0.16;
  const saleActive = watch("sale_active") ?? false;
  const salePrice = watch("sale_price");
  const saleEndDate = watch("sale_end_date");

  const platformPricing = calculatePlatformPricing(vendorPayoutVal, wholesalePriceVal);
  const isLoss = platformPricing.sellerProfit < 0;

  const vatAmount = Math.round(platformPricing.customerPrice * vatRate * 100) / 100;
  const finalCustomerPriceWithVat = Math.round((platformPricing.customerPrice + vatAmount) * 100) / 100;

  const salePriceNum = saleActive && salePrice ? Number(salePrice) : 0;
  const saleVatAmount = saleActive && salePriceNum > 0 ? Math.round(salePriceNum * vatRate * 100) / 100 : 0;
  const finalSalePriceWithVat = saleActive && salePriceNum > 0 ? Math.round((salePriceNum + saleVatAmount) * 100) / 100 : 0;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800 py-3.5 px-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-zinc-500" /> Financial & Platform Pricing (KES)
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Set net seller base payout; platform marketplace fee and customer storefront price calculate automatically
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] uppercase">Step 2 of 6</Badge>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="vendor_payout" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                  Seller Base Payout Price (KES) <span className="text-rose-500">*</span>
                </Label>
                <span className="text-[9px] font-mono text-zinc-400">Min: KES 50 | Max: KES 100M</span>
              </div>
              <Input
                id="vendor_payout"
                type="number"
                min="50"
                max="100000000"
                {...register("vendor_payout")}
                placeholder="e.g. 150000"
                className="font-mono text-base font-bold border-zinc-300 dark:border-zinc-700"
              />
              {errors.vendor_payout && (
                <p className="text-[10px] text-rose-500">{errors.vendor_payout.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wholesale_price" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                Cost / Wholesale COGS Price (KES)
              </Label>
              <Input
                id="wholesale_price"
                type="number"
                min="50"
                max="100000000"
                {...register("wholesale_price")}
                placeholder="e.g. 100000"
                className="font-mono text-base border-zinc-300 dark:border-zinc-700"
              />
              <p className="text-[10px] text-zinc-400">Internal unit manufacturing or supply procurement cost (optional)</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vat_rate" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Percent className="h-3 w-3" /> Applicable VAT / Tax Rate
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 0, label: "Zero Rated (0%)", desc: "Essential medical supplies" },
                { value: 0.08, label: "Reduced (8%)", desc: "Semi-essential devices" },
                { value: 0.16, label: "Standard (16%)", desc: "General medical equipment" },
              ].map((rate) => (
                <button
                  key={rate.value}
                  type="button"
                  onClick={() => setValue("vat_rate", rate.value, { shouldValidate: true })}
                  className={`flex flex-col items-center gap-1.5 p-3 border rounded-lg transition-all text-center ${
                    vatRate === rate.value
                      ? "bg-indigo-50 border-indigo-500 dark:bg-indigo-950/30"
                      : "bg-white border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                  }`}
                >
                  <span className={`text-sm font-bold font-mono ${vatRate === rate.value ? "text-indigo-600" : "text-zinc-500"}`}>
                    {rate.value === 0 ? "0%" : `${(rate.value * 100).toFixed(0)}%`}
                  </span>
                  <span className={`text-[9px] font-medium leading-tight ${vatRate === rate.value ? "text-indigo-700 dark:text-indigo-400" : "text-zinc-400"}`}>
                    {rate.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <TagIcon className="h-3 w-3" /> Promotional / Sale Price
              </Label>
              <Switch
                checked={saleActive}
                onCheckedChange={(checked: boolean) => setValue("sale_active", checked, { shouldValidate: true })}
              />
            </div>

            {saleActive && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sale_price" className="text-xs uppercase tracking-wider font-semibold text-rose-700 dark:text-rose-300">
                    Sale Price (KES) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="sale_price"
                    type="number"
                    min="50"
                    max="100000000"
                    {...register("sale_price")}
                    placeholder="e.g. 125000"
                    className="font-mono text-base font-bold border-rose-300 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/20"
                  />
                  <p className="text-[10px] text-rose-600 dark:text-rose-400">Must be lower than regular Storefront Price</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sale_end_date" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                    Sale Expiration Date (Optional)
                  </Label>
                  <Input
                    id="sale_end_date"
                    type="date"
                    {...register("sale_end_date")}
                    className="font-mono text-xs border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              </div>
            )}
          </div>

          {vendorPayoutVal > 0 && (
            <div className="border-2 border-zinc-800 dark:border-zinc-200 bg-zinc-50 dark:bg-zinc-900 p-5 space-y-4 font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-300 dark:border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Platform Storefront Price Breakdown
                </span>
                <Badge className="bg-emerald-600 text-white text-[10px] font-mono font-bold">
                  Fees based on {wholesalePriceVal > 0 ? "Cost Price" : "Seller Base Price"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-medium">1. Base Payout Price</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-base mt-1 block">
                    KES {vendorPayoutVal.toLocaleString()}
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
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <span className="text-blue-700 dark:text-blue-300 block text-[10px] uppercase font-medium">
                    3. Commission Fee ({platformPricing.commissionPercent}%)
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-base mt-1 block">
                    + KES {platformPricing.commissionAmount.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
                  <span className="text-teal-700 dark:text-teal-300 block text-[10px] uppercase font-medium">
                    4. VAT / Tax ({(vatRate * 100).toFixed(0)}%)
                  </span>
                  <span className="font-bold text-teal-600 dark:text-teal-400 text-base mt-1 block">
                    + KES {vatAmount.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-600 dark:border-emerald-400 md:col-span-2">
                  <span className="text-emerald-800 dark:text-emerald-300 block text-[10px] uppercase font-bold">
                    5. Final Storefront Customer Price (VAT Inclusive)
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg mt-1 block">
                    KES {finalCustomerPriceWithVat.toLocaleString()}
                  </span>
                </div>
              </div>

              {saleActive && salePriceNum > 0 && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 dark:border-rose-400 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-rose-800 dark:text-rose-300 block text-[10px] uppercase font-bold">
                        Active Promotional Sale Price (VAT Inclusive)
                      </span>
                      {saleEndDate && (
                        <span className="text-[9px] text-rose-600 dark:text-rose-400 block mt-1">
                          Valid until {new Date(saleEndDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-rose-600 dark:text-rose-400 text-2xl font-mono block">
                      KES {finalSalePriceWithVat.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {wholesalePriceVal > 0 && isLoss && (
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
