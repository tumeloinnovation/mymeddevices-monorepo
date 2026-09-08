"use client";

import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FileText, Lock, Edit3, AlertCircle, Loader2, Copy, Hash, Package, Trash2, Droplet, Shield, Layers } from "lucide-react";
import { catalogService, CategoryTree, Brand, VendorListItem } from "@mymeddevices/shared-core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Badge } from "../../../ui/badge";
import { Separator } from "../../../ui/separator";
import { SearchableSelect } from "../../../ui/searchable-select";
import { ProductWizardFormData } from "../product-wizard-schema";
import { useProductWizardStore } from "../use-product-wizard-store";

interface StepGeneralProps {
  role: "admin" | "vendor";
  categories: CategoryTree[];
  brands: Brand[];
  vendors?: VendorListItem[];
  onCreateBrand: (name: string) => Promise<string>;
  createBrandLoading: boolean;
  createBrandError?: string | null;
  vendorProducts?: any[];
  onCloneProduct?: (productId: string) => void;
  isCloning?: boolean;
}

export function StepGeneral({
  role,
  categories,
  brands,
  vendors = [],
  onCreateBrand,
  createBrandLoading,
  createBrandError,
  vendorProducts = [],
  onCloneProduct,
  isCloning = false,
}: StepGeneralProps) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ProductWizardFormData>();
  const { slugEditMode, setSlugEditMode, draftProductId } = useProductWizardStore();

  const nameVal = watch("name") || "";
  const slugVal = watch("slug") || "";
  const vendorIdVal = watch("vendor_id");
  const categoryIdVal = watch("category_id");
  const brandVal = watch("brand");
  const productTypeVal = watch("product_type");

  const [slugChecking, setSlugChecking] = useState(false);
  const [slugExists, setSlugExists] = useState(false);

  const handleNameChange = (name: string) => {
    const truncatedName = name.slice(0, 200);
    setValue("name", truncatedName, { shouldValidate: true });

    if (!slugEditMode) {
      const generatedSlug = truncatedName
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 100);
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  };

  useEffect(() => {
    if (categoryIdVal && categories.length > 0) {
      const match = categories.find((c) => c.id === categoryIdVal || c.name === categoryIdVal);
      if (match && watch("category_name") !== match.name) {
        setValue("category_name", match.name);
      }
    }
  }, [categoryIdVal, categories, setValue, watch]);

  useEffect(() => {
    if (brandVal && brands.length > 0) {
      const match = brands.find((b) => b.id === brandVal || b.name === brandVal);
      if (match && watch("brand_name") !== match.name) {
        setValue("brand_name", match.name);
      }
    }
  }, [brandVal, brands, setValue, watch]);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (slugVal && slugVal.length >= 3) {
        setSlugChecking(true);
        try {
          const existingProducts = await catalogService.getVendorProducts({ page: 1, page_size: 100 });
          const duplicate = existingProducts.products?.find(
            (p: any) => p.slug === slugVal && p.id !== draftProductId
          );
          setSlugExists(!!duplicate);
        } catch (error) {
          console.error("Failed to check slug uniqueness:", error);
          setSlugExists(false);
        } finally {
          setSlugChecking(false);
        }
      } else {
        setSlugExists(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [slugVal, draftProductId]);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800 py-3.5 px-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-500" /> Medical Product Identification
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Primary product title, URL slug, category classification, and brand registration
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] uppercase">Step 1 of 6</Badge>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Product Type Classification Selector */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
              Product Classification Type <span className="text-rose-500">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue("product_type", "simple", { shouldValidate: true })}
                className={`p-3 text-left border rounded-lg transition-all flex items-start gap-3 ${
                  (productTypeVal || "simple") === "simple"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                }`}
              >
                <div className={`p-2 rounded-md ${ (productTypeVal || "simple") === "simple" ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500" }`}>
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    Simple Product
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Standalone device with a single SKU & price.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setValue("product_type", "variable", { shouldValidate: true })}
                className={`p-3 text-left border rounded-lg transition-all flex items-start gap-3 ${
                  productTypeVal === "variable"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                }`}
              >
                <div className={`p-2 rounded-md ${ productTypeVal === "variable" ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500" }`}>
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    Variable Product
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Has variations (e.g., Folds, Size, Material).
                  </div>
                </div>
              </button>
            </div>
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="name" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                  Product Name <span className="text-rose-500">*</span>
                </Label>
                <span className={`text-[9px] font-mono ${nameVal.length > 180 ? "text-rose-500" : "text-zinc-400"}`}>
                  {nameVal.length}/200
                </span>
              </div>
              <Input
                id="name"
                value={nameVal}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
                placeholder="e.g. Voluson E10 Ultrasound Diagnostic System"
                maxLength={200}
                className="font-semibold text-sm border-zinc-300 dark:border-zinc-700"
              />
              {errors.name && (
                <p className="text-[10px] text-rose-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="slug" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                  URL Slug {slugEditMode ? "" : "(Auto-generated)"}
                </Label>
                <div className="flex items-center gap-2">
                  {slugChecking && <Loader2 className="h-3 w-3 animate-spin text-amber-500" />}
                  <span className={`text-[9px] font-mono ${slugVal.length > 90 ? "text-rose-500" : "text-zinc-400"}`}>
                    {slugVal.length}/100
                  </span>
                  {!slugEditMode && (
                    <button
                      type="button"
                      onClick={() => setSlugEditMode(true)}
                      className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="h-2.5 w-2.5" /> Edit
                    </button>
                  )}
                </div>
              </div>
              <div className="relative">
                <Input
                  id="slug"
                  value={slugVal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue("slug", e.target.value, { shouldValidate: true })}
                  placeholder="voluson-e10-ultrasound-diagnostic-system"
                  maxLength={100}
                  disabled={!slugEditMode}
                  className={`font-mono text-xs border-zinc-300 dark:border-zinc-700 pr-8 ${!slugEditMode ? "bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed" : ""} ${slugExists ? "border-rose-300" : ""}`}
                />
                {!slugEditMode && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <Lock className="h-3 w-3 text-zinc-400" />
                  </div>
                )}
              </div>
              {slugExists && (
                <p className="text-[10px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> A product with this URL slug already exists. Choose a unique slug.
                </p>
              )}
            </div>
          </div>

          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {role === "admin" && (
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                  Vendor Account <span className="text-rose-500">*</span>
                </Label>
                <SearchableSelect
                  options={vendors.map((v) => ({
                    value: v.id,
                    label: v.store_name || v.company_name || "Unknown Vendor",
                  }))}
                  value={vendorIdVal || ""}
                  onChange={(val: string) => {
                    setValue("vendor_id", val, { shouldValidate: true });
                  }}
                  placeholder="Select registered vendor..."
                  searchPlaceholder="Search vendors..."
                  emptyMessage="No approved vendors found."
                  className="w-full text-xs"
                />
                {errors.vendor_id && (
                  <p className="text-[10px] text-rose-500">{errors.vendor_id.message}</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                Medical Category <span className="text-rose-500">*</span>
              </Label>
              <SearchableSelect
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                value={categoryIdVal || ""}
                onChange={(val: string) => {
                  const cat = categories.find((c) => c.id === val);
                  setValue("category_id", val, { shouldValidate: true });
                  if (cat) setValue("category_name", cat.name);
                }}
                placeholder="Select category..."
                searchPlaceholder="Search categories..."
                emptyMessage="No medical categories found."
                className="w-full text-xs"
              />
              {errors.category_id && (
                <p className="text-[10px] text-rose-500">{errors.category_id.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                Manufacturer / Brand
              </Label>
              <SearchableSelect
                options={brands.map((b) => ({
                  value: b.name,
                  label: b.name,
                  badge: b.approval_status === "pending" ? "Pending" : undefined,
                }))}
                value={
                  brands.find((b) => b.name === brandVal || b.id === brandVal)?.name ||
                  brandVal ||
                  ""
                }
                onChange={(val: string) => {
                  const brand = brands.find((b) => b.id === val || b.name === val);
                  const cleanName = brand ? brand.name : val;
                  setValue("brand", cleanName, { shouldValidate: true });
                  setValue("brand_name", cleanName);
                }}
                placeholder="Select brand..."
                searchPlaceholder="Search brands..."
                emptyMessage="No brands found."
                className="w-full text-xs"
                allowCreate={true}
                onCreateOption={onCreateBrand}
                createLoading={createBrandLoading}
                createError={createBrandError || undefined}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="model_number" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                Model / Part Number
              </Label>
              <Input
                id="model_number"
                {...register("model_number")}
                placeholder="e.g. Voluson-E10-BT20"
                className="font-mono text-xs border-zinc-300 dark:border-zinc-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="internal_reference" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <Hash className="h-3 w-3" /> Internal ERP Reference Code
              </Label>
              <Input
                id="internal_reference"
                {...register("internal_reference")}
                placeholder="e.g. ERP-ITEM-8842"
                className="font-mono text-xs border-zinc-300 dark:border-zinc-700"
              />
            </div>
          </div>

          {role !== "admin" && vendorProducts.length > 0 && onCloneProduct && (
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Quick Clone from Existing Listings:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {vendorProducts.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onCloneProduct(p.id)}
                    disabled={isCloning}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg hover:border-zinc-500 transition-all text-left min-w-[200px]"
                  >
                    <Copy className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 truncate">{p.name}</p>
                      <p className="text-[9px] text-zinc-500 truncate">{p.sku || "No SKU"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
