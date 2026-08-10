"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { ArrowLeft, Check, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsInteger } from "nuqs";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { toast } from "sonner";
import { catalogService, CategoryTree, Brand, VendorListItem, calculatePlatformPricing } from "@mymeddevices/shared-core";

import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { cn } from "../../../lib/utils";

import { productWizardSchema, ProductWizardFormData } from "./product-wizard-schema";
import { useProductWizardStore, WIZARD_STEPS } from "./use-product-wizard-store";
import { StepGeneral } from "./steps/StepGeneral";
import { StepPricing } from "./steps/StepPricing";
import { StepInventory } from "./steps/StepInventory";
import { StepGallery } from "./steps/StepGallery";
import { StepAiSpecs } from "./steps/StepAiSpecs";
import { StepReview } from "./steps/StepReview";

export interface ProductWizardShellProps {
  role: "admin" | "vendor";
  productId?: string;
  initialVendorId?: string;
  categories: CategoryTree[];
  brands: Brand[];
  vendors?: VendorListItem[];
  onSuccessRedirect: (productId: string) => void;
  onBack: () => void;
}

function ProductWizardInner({
  role,
  productId,
  initialVendorId,
  categories,
  brands: initialBrands,
  vendors = [],
  onSuccessRedirect,
  onBack,
}: ProductWizardShellProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [urlStep, setUrlStep] = useQueryState("step", parseAsInteger.withDefault(0));
  const [urlDraftId, setUrlDraftId] = useQueryState("draft");

  const {
    currentStep,
    setStep,
    completedSteps,
    markStepComplete,
    primaryImageIndex,
    draftProductId,
    setDraftProductId,
  } = useProductWizardStore();

  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [createBrandLoading, setCreateBrandLoading] = useState(false);
  const [createBrandError, setCreateBrandError] = useState<string | null>(null);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);

  const methods = useForm<ProductWizardFormData>({
    resolver: standardSchemaResolver(productWizardSchema) as any,
    defaultValues: {
      vendor_id: initialVendorId || "",
      name: "",
      slug: "",
      category_id: "",
      category_name: "",
      brand: "",
      brand_name: "",
      model_number: "",
      product_type: "equipment",
      internal_reference: "",
      vendor_payout: 0,
      wholesale_price: undefined,
      vat_rate: 0.16,
      sale_active: false,
      sale_price: undefined,
      sale_end_date: "",
      sku: "",
      stock_quantity: 0,
      low_stock_threshold: 5,
      stock_status: "instock",
      track_inventory: true,
      weight_kg: undefined,
      length_cm: undefined,
      width_cm: undefined,
      height_cm: undefined,
      description: "",
      short_description: "",
      specifications: {},
      tags: [],
      meta_title: "",
      meta_description: "",
    },
    mode: "onChange",
  });

  const { watch, setValue, trigger } = methods;
  const selectedVendorId = watch("vendor_id");

  useEffect(() => {
    if (urlStep !== currentStep) {
      setStep(urlStep);
    }
  }, []);

  const handleStepChange = (targetStep: number) => {
    setStep(targetStep);
    setUrlStep(targetStep);
  };

  useEffect(() => {
    if (initialBrands && initialBrands.length > 0) {
      setBrands(initialBrands);
    }
  }, [initialBrands]);

  useEffect(() => {
    async function loadVendorProducts() {
      if (selectedVendorId) {
        try {
          const res = await catalogService.getVendorProducts({ vendor_id: selectedVendorId, page: 1, page_size: 10 });
          setVendorProducts(res.products || []);
        } catch (e) {
          console.error("Failed to fetch vendor products:", e);
        }
      }
    }
    loadVendorProducts();
  }, [selectedVendorId]);

  const handleCreateBrand = async (name: string): Promise<string> => {
    setCreateBrandLoading(true);
    setCreateBrandError(null);
    try {
      const newBrand = await catalogService.createQuickBrand({ name });
      setBrands((prev) => [...prev, newBrand]);
      toast.success(`Brand "${name}" registered successfully`);
      return newBrand.id;
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || "Failed to create brand";
      setCreateBrandError(msg);
      toast.error(msg);
      throw error;
    } finally {
      setCreateBrandLoading(false);
    }
  };

  const handleCloneProduct = async (cloneId: string) => {
    setIsCloning(true);
    try {
      const prod = await catalogService.getProduct(cloneId);
      if (prod) {
        setValue("name", `${prod.name} (Copy)`, { shouldValidate: true });
        setValue("slug", `${prod.slug}-copy`, { shouldValidate: true });
        if (prod.description) setValue("description", prod.description);
        if (prod.short_description) setValue("short_description", prod.short_description);
        if (prod.category_id) setValue("category_id", prod.category_id);
        if (prod.category_name) setValue("category_name", prod.category_name);
        if (prod.brand) setValue("brand", prod.brand);
        if (prod.specifications) setValue("specifications", prod.specifications);
        if (prod.tags) setValue("tags", prod.tags);
        toast.success("Product template cloned! Update identity details before saving.");
      }
    } catch (e: any) {
      toast.error("Failed to clone product: " + (e.message || "Unknown error"));
    } finally {
      setIsCloning(false);
    }
  };

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof ProductWizardFormData)[] = [];
    if (currentStep === 0) fieldsToValidate = ["name", "slug", "category_id"];
    if (currentStep === 1) fieldsToValidate = ["vendor_payout"];
    if (currentStep === 2) fieldsToValidate = ["sku", "stock_quantity"];
    if (currentStep === 3 && imagePreviews.length === 0) {
      toast.error("At least 1 product image is required. Upload a primary equipment photo.");
      return;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      markStepComplete(currentStep);
      const nextIdx = currentStep + 1;
      if (nextIdx < WIZARD_STEPS.length) {
        handleStepChange(nextIdx);
      }
    } else {
      toast.error("Please fill in all required fields correctly before continuing.");
    }
  };

  const buildCleanPayload = (formData: ProductWizardFormData, overrideStatus?: string) => {
    const payload: Record<string, any> = {};

    if (overrideStatus) payload.status = overrideStatus;

    if (formData.name?.trim()) payload.name = formData.name.trim();
    if (formData.slug?.trim()) payload.slug = formData.slug.trim();
    if (formData.vendor_id?.trim()) payload.vendor_id = formData.vendor_id.trim();
    if (formData.category_id?.trim()) payload.category_id = formData.category_id.trim();
    if (formData.brand?.trim()) payload.brand = formData.brand.trim();
    if (formData.model_number?.trim()) payload.model_number = formData.model_number.trim();
    if (formData.sku?.trim()) payload.sku = formData.sku.trim();
    if (formData.description?.trim()) payload.description = formData.description.trim();
    if (formData.short_description?.trim()) payload.short_description = formData.short_description.trim();
    if (formData.meta_title?.trim()) payload.meta_title = formData.meta_title.trim();
    if (formData.meta_description?.trim()) payload.meta_description = formData.meta_description.trim();

    if (formData.vendor_payout !== undefined && formData.vendor_payout !== null && !isNaN(Number(formData.vendor_payout))) {
      const vendorPayoutNum = Number(formData.vendor_payout);
      const wholesalePriceNum = Number(formData.wholesale_price || 0);
      const vatRate = formData.vat_rate ?? 0.16;

      payload.vendor_payout = vendorPayoutNum;
      payload.base_price = vendorPayoutNum;

      // Platform pricing calculation
      const pricing = calculatePlatformPricing(vendorPayoutNum, wholesalePriceNum);
      const vatAmount = Math.round(pricing.customerPrice * vatRate * 100) / 100;
      const finalPrice = Math.round((pricing.customerPrice + vatAmount) * 100) / 100;

      payload.markup_price = pricing.markupAmount;
      payload.commission_fee = pricing.commissionAmount;
      payload.price = finalPrice;
    }
    if (formData.wholesale_price !== undefined && formData.wholesale_price !== null && !isNaN(Number(formData.wholesale_price)) && Number(formData.wholesale_price) > 0) {
      payload.wholesale_price = Number(formData.wholesale_price);
    }

    payload.stock_quantity = Number(formData.stock_quantity || 0);
    payload.low_stock_threshold = Number(formData.low_stock_threshold || 5);
    payload.stock_status = formData.stock_status || "instock";
    payload.track_inventory = formData.track_inventory ?? true;

    if (formData.weight_kg !== undefined && formData.weight_kg !== null && !isNaN(Number(formData.weight_kg)) && Number(formData.weight_kg) > 0) {
      payload.weight_kg = Number(formData.weight_kg);
    }

    const length = Number(formData.length_cm);
    const width = Number(formData.width_cm);
    const height = Number(formData.height_cm);
    if ((!isNaN(length) && length > 0) || (!isNaN(width) && width > 0) || (!isNaN(height) && height > 0)) {
      payload.dimensions = {
        ...(length > 0 && { length }),
        ...(width > 0 && { width }),
        ...(height > 0 && { height }),
        unit: "cm",
      };
    }

    if (formData.specifications && Object.keys(formData.specifications).length > 0) {
      payload.specifications = formData.specifications;
    }
    if (formData.tags && formData.tags.length > 0) {
      payload.tags = formData.tags;
    }

    return payload;
  };

  const handleGenerateAiContent = async () => {
    const name = watch("name");
    const categoryId = watch("category_id");

    if (!name || !categoryId) {
      toast.error("Please select product name and medical category first.");
      return;
    }

    setIsGenerating(true);
    try {
      const currentValues = methods.getValues();
      const draftPayload = buildCleanPayload(currentValues, "draft");

      let product;
      if (draftProductId || urlDraftId) {
        const id = draftProductId || urlDraftId;
        product = await catalogService.updateProduct(id!, draftPayload as any);
      } else {
        product = await catalogService.createProduct(draftPayload as any);
        setDraftProductId(product.id);
        setUrlDraftId(product.id);
      }

      const suggestions = await catalogService.getAiSuggestions(product.id, {
        fields_to_generate: ["description", "short_description", "specifications", "tags", "meta_title", "meta_description"],
      });

      if (suggestions.suggestions) {
        const s = suggestions.suggestions;
        if (s.description) setValue("description", s.description);
        if (s.short_description) setValue("short_description", s.short_description);
        if (s.specifications) setValue("specifications", s.specifications);
        if (s.tags) setValue("tags", s.tags);
        if (s.meta_title) setValue("meta_title", s.meta_title);
        if (s.meta_description) setValue("meta_description", s.meta_description);

        toast.success("MedAI details & medical specs generated!");
      }
    } catch (e: any) {
      toast.error("AI Generation failed: " + (e.message || "Unknown error"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const formDataValues = methods.getValues();

      const finalStatus = role === "admin" ? "published" : "pending_review";
      const submitData = buildCleanPayload(formDataValues, finalStatus);

      let product;
      const targetId = productId || draftProductId || urlDraftId;

      if (targetId) {
        product = await catalogService.updateProduct(targetId, submitData as any);
      } else {
        product = await catalogService.createProduct(submitData as any);
      }

      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          try {
            await catalogService.uploadImage(product.id, images[i], {
              is_primary: i === primaryImageIndex,
              sort_order: i,
            });
          } catch (imgError) {
            console.error(`Failed to upload image ${i + 1}:`, imgError);
            toast.error(`Image ${i + 1} upload failed, but product listing was saved.`);
          }
        }
      }

      if (role === "vendor") {
        await catalogService.verifyProduct(product.id);
        toast.success("Product listing submitted for admin moderation!");
      } else {
        toast.success("Product published to catalog successfully!");
      }

      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["vendor"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });

      onSuccessRedirect(product.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={onBack} className="h-9 w-9 border-zinc-300 dark:border-zinc-700">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                  {productId ? "Edit Product Listing" : "New Medical Product Entry"}
                </h1>
                <Badge variant="outline" className="text-[10px] uppercase font-mono font-bold text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400">
                  {role === "admin" ? "Catalog Manager" : "Seller Portal"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Register certified medical devices, configure KES storefront pricing, and utilize MedAI assist
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => handleStepChange(currentStep - 1)} className="text-xs font-semibold">
                Back
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={currentStep === WIZARD_STEPS.length - 1 ? handleFinalSubmit : handleNextStep}
              disabled={submitting}
              className="text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : currentStep === WIZARD_STEPS.length - 1 ? (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                  {role === "admin" ? "Publish Product" : "Submit for Review"}
                </>
              ) : (
                <>
                  Continue <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-1.5 flex items-center gap-1 overflow-x-auto">
          {WIZARD_STEPS.map((step, idx) => {
            const isActive = currentStep === idx;
            const isCompleted = completedSteps.has(idx);

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (isCompleted || idx <= currentStep) {
                    handleStepChange(idx);
                  }
                }}
                disabled={!isCompleted && idx > currentStep}
                className={cn(
                  "flex-1 min-w-[130px] flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium transition-all text-center border",
                  isActive
                    ? "bg-white dark:bg-zinc-950 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold shadow-sm"
                    : isCompleted
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50"
                    : "border-transparent text-zinc-400 dark:text-zinc-600 opacity-60 cursor-not-allowed"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : (
                  <span className="font-mono text-[10px]">{idx + 1}</span>
                )}
                <span className="truncate">{step.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
            {currentStep === 0 && (
              <StepGeneral
                role={role}
                categories={categories}
                brands={brands}
                vendors={vendors}
                onCreateBrand={handleCreateBrand}
                createBrandLoading={createBrandLoading}
                createBrandError={createBrandError}
                vendorProducts={vendorProducts}
                onCloneProduct={handleCloneProduct}
                isCloning={isCloning}
              />
            )}
            {currentStep === 1 && <StepPricing />}
            {currentStep === 2 && <StepInventory />}
            {currentStep === 3 && (
              <StepGallery
                images={images}
                imagePreviews={imagePreviews}
                setImages={setImages}
                setImagePreviews={setImagePreviews}
              />
            )}
            {currentStep === 4 && (
              <StepAiSpecs
                onGenerateAiContent={handleGenerateAiContent}
                isGenerating={isGenerating}
              />
            )}
            {currentStep === 5 && (
              <StepReview
                role={role}
                imagePreviews={imagePreviews}
                isSubmitting={submitting}
                onSubmit={handleFinalSubmit}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </FormProvider>
  );
}

export function ProductWizardShell(props: ProductWizardShellProps) {
  return (
    <NuqsAdapter>
      <ProductWizardInner {...props} />
    </NuqsAdapter>
  );
}
