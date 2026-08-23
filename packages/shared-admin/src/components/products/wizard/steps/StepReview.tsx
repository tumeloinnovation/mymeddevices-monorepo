"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Eye, CheckCircle2, Loader2, Edit3 } from "lucide-react";
import { calculatePlatformPricing } from "@mymeddevices/shared-core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { ProductWizardFormData } from "../product-wizard-schema";
import { useProductWizardStore } from "../use-product-wizard-store";

interface StepReviewProps {
  role: "admin" | "vendor";
  imagePreviews: string[];
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
}

export function StepReview({ role, imagePreviews, isSubmitting, onSubmit }: StepReviewProps) {
  const { watch } = useFormContext<ProductWizardFormData>();
  const { setStep, primaryImageIndex } = useProductWizardStore();

  const nameVal = watch("name") || "—";
  const skuVal = watch("sku") || "—";
  const stockQty = Number(watch("stock_quantity")) || 0;
  const basePriceVal = Number(watch("base_price")) || 0;
  const costPriceVal = Number(watch("cost_price")) || 0;
  const rawVatRate = watch("vat_rate") ?? 16;
  const vatRateDecimal = rawVatRate > 1 ? rawVatRate / 100 : rawVatRate;

  const platformPricing = calculatePlatformPricing(basePriceVal, costPriceVal);
  const finalCustomerPrice = platformPricing.customerPrice;
  const saleActive = watch("sale_active");
  const compareAtPrice = watch("compare_at_price");

  const primaryImageSrc = imagePreviews[primaryImageIndex] || imagePreviews[0];

  return (
    <div className="space-y-6">
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800 py-3.5 px-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <Eye className="h-4 w-4 text-zinc-500" /> Listing Summary Verification
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Confirm product attributes, pricing, and variations before publishing to the marketplace
            </CardDescription>
          </div>
          <Badge className="bg-emerald-600 text-white font-mono text-[10px] uppercase">
            {role === "admin" ? "Ready to Publish" : "Ready for Review"}
          </Badge>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {primaryImageSrc && (
              <div className="w-32 h-32 border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-100 flex-shrink-0">
                <img src={primaryImageSrc} alt="Primary preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 space-y-2 font-mono text-xs w-full">
              <div className="p-3 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-500">Product Name:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{nameVal}</span>
              </div>
              <div className="p-3 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-500">Medical Category:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {watch("category_name") || "General Medical Equipment"}
                </span>
              </div>
              {watch("brand_name") && (
                <div className="p-3 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-500">Manufacturer / Brand:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{watch("brand_name")}</span>
                </div>
              )}
              <div className="p-3 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-500">SKU / Stock Level:</span>
                <span>{skuVal} ({stockQty} units available)</span>
              </div>
              <div className="p-3 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-500">Seller Base Payout:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">KES {basePriceVal.toLocaleString()}</span>
              </div>
              {saleActive && compareAtPrice && Number(compareAtPrice) > 0 && (
                <div className="p-3 border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 flex justify-between items-center">
                  <span className="text-rose-700 dark:text-rose-300 font-bold uppercase text-[11px]">Compare-At Original Price:</span>
                  <span className="font-bold text-zinc-400 line-through">KES {Number(compareAtPrice).toLocaleString()}</span>
                </div>
              )}
              <div className="p-3 border-2 border-emerald-600 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 flex justify-between items-center">
                <span className="text-emerald-800 dark:text-emerald-300 font-bold uppercase text-[11px]">
                  Storefront Customer Price:
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                  KES {finalCustomerPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(0)}
              className="text-xs font-semibold"
            >
              <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit Identity Details
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {role === "admin" ? "Publish Product to Catalog" : "Submit Listing for Admin Review"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
