"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  FileText,
  ShoppingCart,
  Package,
  Settings2,
  Eye,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  Upload,
  Tag,
  AlertCircle,
  Zap,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuthStore } from "@mymeddevices/shared-core";
import { catalogService, ProductCreate } from "@mymeddevices/shared-core";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useCategories, useProduct } from "@/lib/api/hooks/useCatalog";

// --- Form Schema ---
const productSchema = z.object({
  // General Info
  name: z.string().min(3, "Product name is too short"),
  slug: z.string().optional(),
  category_id: z.string().min(1, "Please select a category"),
  brand: z.string().optional(),
  model_number: z.string().optional(),

  // Pricing
  base_price: z.coerce.number().min(1, "Selling price must be greater than 0"),
  cost_price: z.coerce.number().optional(),

  // Inventory & Physical
  sku: z.string().min(3, "SKU is required"),
  stock_quantity: z.coerce.number().min(0, "Stock cannot be negative"),
  low_stock_threshold: z.coerce.number().min(0, "Low stock threshold cannot be negative").optional(),
  track_inventory: z.boolean().optional(),
  weight_kg: z.coerce.number().min(0, "Weight cannot be negative").optional(),

  // Content (AI Generated)
  description: z.string().optional(),
  short_description: z.string().optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
});

function calculatePlatformMarkup(basePrice: number) {
  if (!basePrice || basePrice <= 0) return { markup: 0, percent: 5, commission: 0, commissionPercent: 2, total: 0 };
  let percent = 2.0;
  if (basePrice <= 10000) {
    percent = 5.0;
  } else if (basePrice <= 50000) {
    percent = 3.0;
  }
  const markup = basePrice * (percent / 100);
  const commission = basePrice * 0.02;
  const total = basePrice + markup + commission;
  return {
    markup: Math.round(markup * 100) / 100,
    percent,
    commission: Math.round(commission * 100) / 100,
    commissionPercent: 2,
    total: Math.round(total * 100) / 100
  };
}

type FormData = z.infer<typeof productSchema>;

const STEPS = [
  { id: "general", label: "General Info", icon: FileText, description: "Basic product details" },
  { id: "pricing", label: "Pricing", icon: ShoppingCart, description: "Price and currency" },
  { id: "inventory", label: "Inventory & Physical", icon: Package, description: "Stock, SKU, weight" },
  { id: "gallery", label: "Product Gallery", icon: ImageIcon, description: "Manage images" },
  { id: "ai", label: "AI Assist", icon: Sparkles, description: "MedAI content & tags" },
  { id: "review", label: "Review", icon: Eye, description: "Confirm & publish" },
];

export function ProductWizard({ productId }: { productId?: string }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftProductId, setDraftProductId] = useState<string | null>(productId || null);

  // Gallery state
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);

  // Categories and brands
  const { data: categories } = useCategories();
  const [brands, setBrands] = useState<{ id: string; name: string; approval_status?: string }[]>([]);
  const [createBrandLoading, setCreateBrandLoading] = useState(false);
  const [createBrandError, setCreateBrandError] = useState<string | null>(null);

  // Fetch product in edit mode
  const { data: product, loading: productLoading } = useProduct(productId || "");

  // Fetch brands on mount
  useEffect(() => {
    async function fetchBrands() {
      try {
        const result = await catalogService.getBrands({ active_only: true });
        setBrands(result.brands || []);
      } catch (error) {
        console.error("Failed to fetch brands:", error);
        // Fallback to hardcoded brands if API fails
        setBrands([
          { id: "ge-healthcare", name: "GE Healthcare" },
          { id: "philips", name: "Philips Healthcare" },
          { id: "siemens", name: "Siemens Healthineers" },
          { id: "medtronic", name: "Medtronic" },
          { id: "fujifilm", name: "Fujifilm Medical" },
          { id: "canon", name: "Canon Medical Systems" },
          { id: "mindray", name: "Mindray Medical" },
          { id: "other", name: "Other" },
        ]);
      }
    }
    fetchBrands();
  }, []);

  const handleCreateBrand = async (name: string): Promise<string> => {
    setCreateBrandLoading(true);
    setCreateBrandError(null);

    try {
      const newBrand = await catalogService.createQuickBrand({ name });
      // Add the new brand to the local brands list
      setBrands(prev => [...prev, { id: newBrand.id, name: newBrand.name, approval_status: newBrand.approval_status }]);
      toast.success(`Brand "${name}" created and approved`);
      return newBrand.id;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || "Failed to create brand";
      setCreateBrandError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setCreateBrandLoading(false);
    }
  };

  const flatCategories = useMemo(() => {
    if (!categories) return [];
    const result: typeof categories = [];
    const flatten = (catList: typeof categories) => {
      catList.forEach((cat) => {
        result.push(cat);
        if (cat.children?.length > 0) flatten(cat.children);
      });
    };
    flatten(categories);
    return result;
  }, [categories]);

  // Form setup
  const methods = useForm<FormData>({
    resolver: standardSchemaResolver(productSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      category_id: "",
      brand: "",
      model_number: "",
      base_price: 0,
      cost_price: undefined,
      sku: "",
      stock_quantity: 0,
      low_stock_threshold: 5,
      track_inventory: true,
      weight_kg: undefined,
      description: "",
      short_description: "",
      specifications: {},
      tags: [],
      meta_title: "",
      meta_description: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, trigger, watch, setValue, formState: { errors } } = methods;

  // Load product if editing
  useEffect(() => {
    if (productId && product) {
      setDraftProductId(productId);
      const prod = product as any;

      methods.reset({
        name: prod.name || "",
        slug: prod.slug || "",
        category_id: prod.category_id || "",
        brand: prod.brand || "",
        model_number: prod.model_number || "",
        base_price: prod.base_price || prod.price || 0,
        cost_price: prod.cost_price || undefined,
        sku: prod.sku || "",
        stock_quantity: prod.stock_quantity ?? 0,
        low_stock_threshold: prod.low_stock_threshold || 5,
        track_inventory: prod.track_inventory ?? true,
        weight_kg: prod.weight_kg || undefined,
        description: prod.description || "",
        short_description: prod.short_description || "",
        specifications: prod.specifications || {},
        tags: prod.tags || [],
        meta_title: prod.meta_title || "",
        meta_description: prod.meta_description || "",
      });

      if (prod.images && prod.images.length > 0) {
        const sortedImages = [...prod.images].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        setImagePreviews(sortedImages.map((img: any) => img.image_url || img.url));
        const primaryIdx = sortedImages.findIndex((img: any) => img.is_primary);
        setPrimaryImageIndex(primaryIdx >= 0 ? primaryIdx : 0);
      }

      setCompletedSteps(new Set(Array.from({ length: STEPS.length }, (_, i) => i)));
    }
  }, [productId, product, methods]);

  // Prefill category from URL parameter during creation
  useEffect(() => {
    if (!productId && typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const urlCategoryId = searchParams.get("category_id");
      if (urlCategoryId) {
        setValue("category_id", urlCategoryId);
      }
    }
  }, [productId, setValue]);

  // Generate slug from name
  const generateSlug = (name: string) => {
    const slug = name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setValue("slug", slug);
  };

  // Specifications helpers
  const specs = watch("specifications") || {};

  const handleSpecChange = (oldKey: string, newKey: string, newValue: string) => {
    const updated = { ...specs };
    if (oldKey !== newKey) {
      delete updated[oldKey];
    }
    updated[newKey] = newValue;
    setValue("specifications", updated, { shouldValidate: true, shouldDirty: true });
  };

  const handleSpecDelete = (keyToDelete: string) => {
    const updated = { ...specs };
    delete updated[keyToDelete];
    setValue("specifications", updated, { shouldValidate: true, shouldDirty: true });
  };

  const handleSpecAdd = () => {
    const updated = { ...specs };
    let newKey = "New Specification";
    let counter = 1;
    while (newKey in updated) {
      newKey = `New Specification ${counter}`;
      counter++;
    }
    updated[newKey] = "";
    setValue("specifications", updated, { shouldValidate: true, shouldDirty: true });
  };

  const specEntries = Object.entries(specs);

  // Tags helpers
  const tags = watch("tags") || [];
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    const cleanTag = tagInput.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag)) {
      setValue("tags", [...tags, cleanTag], { shouldValidate: true, shouldDirty: true });
    }
    setTagInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue("tags", tags.filter((t: string) => t !== tagToRemove), { shouldValidate: true, shouldDirty: true });
  };

  // AI Content Generation for individual fields
  const generateSingleField = async (fieldName: string) => {
    const name = watch("name");
    const categoryId = watch("category_id");

    if (!name) {
      toast.error("Please provide a product name first.");
      return;
    }

    setIsGenerating(true);
    try {
      // Ensure we have a draft product
      const draftData = methods.getValues();
      const productData = {
        ...draftData,
        status: "draft" as const
      };

      let product;
      if (draftProductId) {
        product = await catalogService.updateProduct(draftProductId, productData);
      } else {
        product = await catalogService.createProduct(productData as ProductCreate);
        setDraftProductId(product.id);
      }

      // Generate just the requested field
      const suggestions = await catalogService.getAiSuggestions(product.id, {
        fields_to_generate: [fieldName]
      });

      if (suggestions.suggestions) {
        const { suggestions: s } = suggestions;

        // Map field names to form field names
        const fieldMap: Record<string, string> = {
          "description": "description",
          "short_description": "short_description",
          "specifications": "specifications",
          "tags": "tags",
          "meta_title": "meta_title",
          "meta_description": "meta_description"
        };

        if (s[fieldName]) {
          setValue(fieldMap[fieldName] as any, s[fieldName]);
          toast.success(`${fieldName.replace(/_/g, " ")} generated successfully!`);
        }
      }
    } catch (error: any) {
      toast.error("AI generation failed: " + (error.message || "Unknown error"));
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Content Generation (all fields at once)
  const generateAIContent = async () => {
    const name = watch("name");
    const categoryId = watch("category_id");

    if (!name || !categoryId) {
      toast.error("Please provide a name and category first.");
      return;
    }

    setIsGenerating(true);
    try {
      const draftData = methods.getValues();

      const productData = {
        ...draftData,
        status: "draft" as const
      };

      let product;
      if (draftProductId) {
        product = await catalogService.updateProduct(draftProductId, productData);
      } else {
        product = await catalogService.createProduct(productData as ProductCreate);
        setDraftProductId(product.id);
      }

      const suggestions = await catalogService.getAiSuggestions(product.id, {
        fields_to_generate: ["description", "short_description", "specifications", "tags", "meta_title", "meta_description"]
      });

      if (suggestions.suggestions) {
        const { suggestions: s } = suggestions;
        if (s.description) setValue("description", s.description);
        if (s.short_description) setValue("short_description", s.short_description);
        if (s.specifications) setValue("specifications", s.specifications);
        if (s.tags) setValue("tags", s.tags);
        if (s.meta_title) setValue("meta_title", s.meta_title);
        if (s.meta_description) setValue("meta_description", s.meta_description);

        toast.success("AI content and specifications generated successfully!");
      }
    } catch (error: any) {
      toast.error("AI Generation failed: " + (error.message || "Unknown error"));
    } finally {
      setIsGenerating(false);
    }
  };

  // Navigation
  const handleNext = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (currentStep === 0) {
      fieldsToValidate = ["name", "category_id"];
    } else if (currentStep === 1) {
      fieldsToValidate = ["base_price"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["sku", "stock_quantity"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      toast.error("Please fill in all required fields correctly.");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Submit
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const vendorId = user?.id;
      if (!vendorId) {
        toast.error("Unable to determine vendor ID. Please log in again.");
        return;
      }

      const submitData = {
        ...data,
        vendor_id: vendorId,
      };

      let product;
      if (productId) {
        product = await catalogService.updateProduct(productId, submitData);
      } else if (draftProductId) {
        product = await catalogService.updateProduct(draftProductId, submitData);
      } else {
        product = await catalogService.createProduct(submitData as ProductCreate);
        setDraftProductId(product.id);
      }

      // Upload images if any
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await catalogService.uploadImage(product.id, images[i], {
            is_primary: i === primaryImageIndex,
            sort_order: i,
          });
        }
      }

      if (productId) {
        toast.success("Product updated successfully!");
      } else {
        // Verify the product to submit it for admin review (only for new creations)
        await catalogService.verifyProduct(product.id);
        toast.success("Product created successfully and submitted for review!");
      }
      
      router.push("/vendor/products");
    } catch (error: any) {
      toast.error(error.message || (productId ? "Failed to update product" : "Failed to create product"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step Icon Component
  const StepIcon = ({ step, index }: { step: typeof STEPS[0]; index: number }) => {
    const Icon = step.icon;
    const isCompleted = completedSteps.has(index);
    const isCurrent = currentStep === index;

    return (
      <div className="relative">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
          isCompleted && "bg-emerald-500 border-emerald-500 text-white",
          isCurrent && "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30",
          !isCompleted && !isCurrent && "bg-muted/50 border-muted-foreground/20 text-muted-foreground"
        )}>
          {isCompleted ? (
            <Check className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>
        {index < STEPS.length - 1 && (
          <div className={cn(
            "absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-8 -z-10 transition-colors duration-300",
            isCompleted ? "bg-emerald-500" : "bg-muted-foreground/10"
          )} />
        )}
      </div>
    );
  };

  if (productId && productLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9 rounded-xl"
          >
            <ChevronsUpDown className="h-4 w-4 rotate-90" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">New Product</h1>
            <p className="text-sm text-muted-foreground">List your medical equipment for sale</p>
          </div>
        </div>
        <Button
          onClick={currentStep === STEPS.length - 1 ? handleSubmit(onSubmit) : handleNext}
          disabled={isSubmitting}
          className="rounded-xl font-semibold shadow-lg shadow-primary/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : currentStep === STEPS.length - 1 ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Publish Product
            </>
          ) : (
            <>
              Continue
              <ChevronsUpDown className="ml-2 h-4 w-4 rotate-90" />
            </>
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Steps */}
        <div className="w-72 border-r bg-muted/30 flex-shrink-0 overflow-y-auto">
          <div className="p-6 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6">
              Setup Steps
            </h2>
            <nav className="space-y-1">
              {STEPS.map((step, index) => {
                const isActive = currentStep === index;
                const isCompleted = completedSteps.has(index);

                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (isCompleted || index < currentStep) {
                        setCurrentStep(index);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 text-left",
                      isActive && "bg-white shadow-md border border-border",
                      !isActive && isCompleted && "hover:bg-muted/50",
                      !isActive && !isCompleted && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={!isCompleted && index > currentStep}
                  >
                    <StepIcon step={step} index={index} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-semibold transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {step.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right Side - Form Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {currentStep === 0 && (
                      <StepGeneral
                        flatCategories={flatCategories}
                        brands={brands}
                        onNameChange={generateSlug}
                        onCreateBrand={handleCreateBrand}
                        createBrandLoading={createBrandLoading}
                        createBrandError={createBrandError || undefined}
                      />
                    )}
                    {currentStep === 1 && <StepPricing />}
                    {currentStep === 2 && <StepInventory isEdit={!!productId} />}
                    {currentStep === 3 && (
                      <StepGallery
                        images={images}
                        setImages={setImages}
                        previews={imagePreviews}
                        setPreviews={setImagePreviews}
                        primaryImageIndex={primaryImageIndex}
                        setPrimaryImageIndex={setPrimaryImageIndex}
                      />
                    )}
                    {currentStep === 4 && (
                      <StepAIAssist
                        isGenerating={isGenerating}
                        onGenerate={generateAIContent}
                        onGenerateField={generateSingleField}
                        specs={specs}
                        specEntries={specEntries}
                        onSpecChange={handleSpecChange}
                        onSpecDelete={handleSpecDelete}
                        onSpecAdd={handleSpecAdd}
                        tags={tags}
                        tagInput={tagInput}
                        setTagInput={setTagInput}
                        onAddTag={handleAddTag}
                        onKeyDown={handleKeyDown}
                        onRemoveTag={handleRemoveTag}
                      />
                    )}
                    {currentStep === 5 && <StepReview data={watch()} />}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-8 border-t mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="rounded-xl"
                  >
                    <ChevronsUpDown className="mr-2 h-4 w-4 rotate-90" />
                    Back
                  </Button>

                  <Button
                    type={currentStep === STEPS.length - 1 ? "submit" : "button"}
                    onClick={currentStep === STEPS.length - 1 ? undefined : handleNext}
                    disabled={isSubmitting}
                    className="rounded-xl shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : currentStep === STEPS.length - 1 ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Publish Product
                      </>
                    ) : (
                      <>
                        Continue
                        <ChevronsUpDown className="ml-2 h-4 w-4 rotate-90" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Step Components ---

function StepGeneral({
  flatCategories,
  brands,
  onNameChange,
  onCreateBrand,
  createBrandLoading,
  createBrandError,
}: {
  flatCategories: any[];
  brands: { id: string; name: string; approval_status?: string }[];
  onNameChange: (name: string) => void;
  onCreateBrand?: (name: string) => Promise<string>;
  createBrandLoading?: boolean;
  createBrandError?: string;
}) {
  const { register, setValue, watch } = useFormContext();
  const name = watch("name");
  const slug = watch("slug");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">General Information</h2>
        <p className="text-muted-foreground mt-1">Enter the basic details for your product.</p>
      </div>

      <Card className="border-border/50 shadow-xl shadow-foreground/5">
        <CardHeader>
          <CardTitle>Core Details</CardTitle>
          <CardDescription>The essential information that identifies your product.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="e.g. MRI Scanner Model X"
                className="h-11"
              />
            </div>
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="slug" className="text-xs font-semibold uppercase tracking-wider">
                Slug
              </Label>
              <Input
                id="slug"
                {...register("slug")}
                value={slug}
                placeholder="mri-scanner-model-x"
                className="h-11 font-mono text-sm"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch("category_id")}
              onValueChange={(value) => setValue("category_id", value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {flatCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="brand" className="text-xs font-semibold uppercase tracking-wider">
                Brand
              </Label>
              <SearchableSelect
                options={brands.map((b) => ({
                  value: b.id,
                  label: b.name,
                  badge: b.approval_status === 'pending' ? 'Pending' : undefined,
                }))}
                value={watch("brand")}
                onChange={(value) => setValue("brand", value)}
                placeholder="Select brand..."
                searchPlaceholder="Search brands..."
                emptyMessage="No brands found."
                className="w-full"
                allowCreate={!!onCreateBrand}
                onCreateOption={onCreateBrand}
                createLoading={createBrandLoading}
                createError={createBrandError}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="model_number" className="text-xs font-semibold uppercase tracking-wider">
                Model Number
              </Label>
              <Input
                id="model_number"
                {...register("model_number")}
                placeholder="e.g. Voluson E10"
                className="h-11 font-semibold"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StepPricing() {
  const { register, watch } = useFormContext();
  const watchedBasePrice = watch("base_price") || 0;
  
  const pricingBreakdown = React.useMemo(() => {
    return calculatePlatformMarkup(Number(watchedBasePrice));
  }, [watchedBasePrice]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pricing</h2>
        <p className="text-muted-foreground mt-1">Set the pricing details for your product.</p>
      </div>

      <Card className="border-border/50 shadow-xl shadow-foreground/5 overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-border/30">
          <CardTitle>Price Information</CardTitle>
          <CardDescription>Configure the cost price and your selling price.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="cost_price" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cost Price (KES)
              </Label>
              <Input
                id="cost_price"
                type="number"
                {...register("cost_price")}
                placeholder="Price you bought it for (optional)"
                className="h-11 font-semibold"
              />
              <p className="text-[11px] text-muted-foreground">For your internal tracking only (not shown to customers).</p>
            </div>
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="base_price" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Your Selling Price (KES) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="base_price"
                type="number"
                {...register("base_price")}
                placeholder="Price you want to sell it for"
                className="h-11 text-lg font-semibold"
              />
              <p className="text-[11px] text-muted-foreground">The amount you will receive from sales.</p>
            </div>
          </div>

          {watchedBasePrice > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Your Base Payout (Net):</span>
                <span className="font-semibold text-foreground">KES {Number(watchedBasePrice).toLocaleString("en-KE")}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Platform Tier Markup ({pricingBreakdown.percent}%):</span>
                <span>+ KES {pricingBreakdown.markup.toLocaleString("en-KE")}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Platform Commission Fee (2%):</span>
                <span>+ KES {pricingBreakdown.commission.toLocaleString("en-KE")}</span>
              </div>
              <div className="border-t border-primary/20 pt-2 flex items-center justify-between text-base font-bold text-primary">
                <span>Customer Retail List Price:</span>
                <span>KES {pricingBreakdown.total.toLocaleString("en-KE")}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StepInventory({ isEdit }: { isEdit?: boolean }) {
  const { register, setValue, watch } = useFormContext();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inventory & Physical</h2>
        <p className="text-muted-foreground mt-1">Manage stock, SKU, and physical attributes.</p>
      </div>

      <Card className="border-border/50 shadow-xl shadow-foreground/5">
        <CardHeader>
          <CardTitle>Stock & Physical Management</CardTitle>
          <CardDescription>Set up inventory levels and weight.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sku" className="text-xs font-semibold uppercase tracking-wider">
                  SKU <span className="text-red-500">*</span>
                </Label>
                {!isEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const name = watch("name") || "";
                      const brand = watch("brand") || "";
                      const category_id = watch("category_id") || "";
                      // Generate SKU: first 3 letters of brand (upper) + first 3 of category + random 4 digits
                      const brandPart = (brand || "GEN").substring(0, 3).toUpperCase();
                      const catPart = (category_id ? category_id.substring(0, 3) : "CAT").toUpperCase();
                      const randomPart = Math.floor(1000 + Math.random() * 9000);
                      const generatedSku = `${brandPart}-${catPart}-${randomPart}`;
                      setValue("sku", generatedSku);
                    }}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto-generate
                  </Button>
                )}
              </div>
              <Input
                id="sku"
                {...register("sku")}
                placeholder="e.g. MRI-102-X"
                className="h-11 font-mono"
                disabled={isEdit}
              />
              <p className="text-[10px] text-muted-foreground">Click auto-generate to create a unique SKU based on brand and category.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_quantity" className="text-xs font-semibold uppercase tracking-wider">
                {isEdit ? "Stock Quantity" : "Initial Stock"} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stock_quantity"
                type="number"
                {...register("stock_quantity")}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold" className="text-xs font-semibold uppercase tracking-wider">
                Low Stock Alert
              </Label>
              <Input
                id="low_stock_threshold"
                type="number"
                {...register("low_stock_threshold")}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight_kg" className="text-xs font-semibold uppercase tracking-wider">
                Weight (kg)
              </Label>
              <div className="relative">
                <Input
                  id="weight_kg"
                  type="number"
                  step="any"
                  {...register("weight_kg")}
                  placeholder="e.g. 12.5"
                  className="h-11 pr-12 font-semibold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground text-xs">kg</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div>
              <Label htmlFor="track_inventory" className="text-sm font-semibold">Track Inventory</Label>
              <p className="text-xs text-muted-foreground">Automatically deduct stock on orders</p>
            </div>
            <Switch
              id="track_inventory"
              checked={watch("track_inventory")}
              onCheckedChange={(checked) => setValue("track_inventory", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StepGallery({
  images,
  setImages,
  previews,
  setPreviews,
  primaryImageIndex,
  setPrimaryImageIndex,
}: {
  images: File[];
  setImages: (files: File[]) => void;
  previews: string[];
  setPreviews: (previews: string[]) => void;
  primaryImageIndex: number;
  setPrimaryImageIndex: (index: number) => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImages([...images, ...files]);
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setPreviews([...previews, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
    let newIndex = primaryImageIndex;
    if (index === primaryImageIndex) {
      newIndex = 0;
    } else if (index < primaryImageIndex) {
      newIndex = primaryImageIndex - 1;
    } else {
      newIndex = primaryImageIndex;
    }
    setPrimaryImageIndex(newIndex);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Product Gallery</h2>
        <p className="text-muted-foreground mt-1">Upload and manage product clinical images.</p>
      </div>

      <Card className="border-border/50 shadow-xl shadow-foreground/5">
        <CardHeader>
          <CardTitle>Image Gallery</CardTitle>
          <CardDescription>Add up to 5 clinical images. Click on any image to set it as primary.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence>
              {previews.map((src, idx) => (
                <motion.div
                  key={src}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => setPrimaryImageIndex(idx)}
                  className={cn(
                    "relative aspect-square rounded-2xl overflow-hidden group border cursor-pointer transition-all",
                    idx === primaryImageIndex ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border hover:border-primary/50"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="Preview" className="object-cover w-full h-full" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(idx);
                    }}
                    className="absolute top-2 right-2 h-7 w-7 bg-white/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all border border-border"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                  {idx === primaryImageIndex ? (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/95 text-[9px] font-bold text-white py-1 text-center uppercase tracking-wider">Primary</div>
                  ) : (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] font-bold text-white py-1 text-center uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Set Primary</div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <label className="aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Add Image</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-300">Clinical Image Standards</p>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-medium leading-relaxed mt-1">
                Please upload high-resolution images: 1. Main perspective view, 2. Control console or screen interface, 3. Serial / rating plate label, 4. Included accessories.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StepAIAssist({
  isGenerating,
  onGenerate,
  onGenerateField,
  specs,
  specEntries,
  onSpecChange,
  onSpecDelete,
  onSpecAdd,
  tags,
  tagInput,
  setTagInput,
  onAddTag,
  onKeyDown,
  onRemoveTag,
}: {
  isGenerating: boolean;
  onGenerate: () => void;
  onGenerateField: (field: string) => void;
  specs: Record<string, string>;
  specEntries: [string, string][];
  onSpecChange: (oldKey: string, newKey: string, newValue: string) => void;
  onSpecDelete: (key: string) => void;
  onSpecAdd: () => void;
  tags: string[];
  tagInput: string;
  setTagInput: (value: string) => void;
  onAddTag: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveTag: (tag: string) => void;
}) {
  const { register, watch } = useFormContext();
  const name = watch("name");
  const categoryId = watch("category_id");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Assist & Technical Details</h2>
        <p className="text-muted-foreground mt-1">Generate details using MedAI and manage technical specifications.</p>
      </div>

      {/* MedAI Assist Card - Compact */}
      <Card className="border-border/50 shadow-lg shadow-foreground/5 bg-gradient-to-br from-amber-500/[0.02] to-primary/[0.02] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
          <Zap className="h-16 w-16 text-primary" />
        </div>
        <CardContent className="flex items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm bg-white border ${isGenerating ? "animate-pulse" : ""}`}>
              {isGenerating ? <Loader2 className="h-4 w-4 text-primary animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold">AI Generate</h3>
              <p className="text-[10px] text-muted-foreground">Auto-fill descriptions, specs & tags</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || !name || !categoryId}
            className="rounded-lg h-9 px-4 text-xs font-semibold gap-2"
          >
            {isGenerating ? "Generating..." : "Generate"}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>

      {/* Description Card */}
      <Card className="border-border/50 shadow-xl shadow-foreground/5">
        <CardHeader>
          <CardTitle>Product Descriptions</CardTitle>
          <CardDescription>Detailed information and short summary generated by AI or entered manually.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="short_description" className="text-xs font-semibold uppercase tracking-wider">
                Short Description
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onGenerateField("short_description")}
                disabled={isGenerating}
                className="h-7 text-xs gap-1.5 text-primary hover:text-primary/80"
              >
                <Sparkles className="h-3 w-3" />
                AI Generate
              </Button>
            </div>
            <Textarea id="short_description" {...register("short_description")} rows={3} placeholder="A brief summary for listings..." className="resize-none" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider">
                Description
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onGenerateField("description")}
                disabled={isGenerating}
                className="h-7 text-xs gap-1.5 text-primary hover:text-primary/80"
              >
                <Sparkles className="h-3 w-3" />
                AI Generate
              </Button>
            </div>
            <Textarea id="description" {...register("description")} rows={6} placeholder="Provide a detailed description of the product..." className="resize-none" />
          </div>
        </CardContent>
      </Card>

      {/* Technical Specs Card */}
      <Card className="border-border/50 shadow-xl shadow-foreground/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Technical Specifications</CardTitle>
            <CardDescription>Define clinical and physical specifications as key-value pairs.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onGenerateField("specifications")}
              disabled={isGenerating}
              className="rounded-xl h-9 text-xs font-semibold gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Generate Specs
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onSpecAdd} className="rounded-xl h-9 text-xs font-semibold gap-2">
              <Plus className="h-3.5 w-3.5" />
              Add Spec
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {specEntries.length === 0 ? (
            <div className="text-center p-8 rounded-xl bg-muted/20 border border-dashed border-muted text-xs text-muted-foreground font-medium">
              No specifications yet. Click "AI Generate Specs" to auto-generate based on your product category, or add manually.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specEntries.map(([key, val], idx) => (
                <div key={idx} className="flex gap-2 items-center bg-muted/30 p-2 rounded-xl border">
                  <Input
                    value={key}
                    onChange={(e) => onSpecChange(key, e.target.value, val)}
                    placeholder="e.g. Dimensions"
                    className="h-9 rounded-lg font-bold text-xs"
                  />
                  <Input
                    value={val}
                    onChange={(e) => onSpecChange(key, key, e.target.value)}
                    placeholder="Value"
                    className="h-9 rounded-lg text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onSpecDelete(key)}
                    className="rounded-lg h-9 w-9 text-red-500 hover:bg-red-500/10 transition-all flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags Card */}
      <Card className="border-border/50 shadow-xl shadow-foreground/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Manage categorizations and keywords for storefront navigation.</CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onGenerateField("tags")}
            disabled={isGenerating}
            className="h-7 text-xs gap-1.5 text-primary hover:text-primary/80"
          >
            <Sparkles className="h-3 w-3" />
            AI Generate Tags
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 p-3 min-h-[56px] rounded-xl border bg-white items-center">
            {tags.map((tag) => (
              <div key={tag} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
                <span>{tag}</span>
                <button type="button" onClick={() => onRemoveTag(tag)} className="text-primary hover:text-red-500 rounded-full transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={onAddTag}
              placeholder={tags.length === 0 ? "e.g. ultrasound, portable, ge (Press Enter to add)" : "Add more tags..."}
              className="flex-grow min-w-[120px] bg-transparent outline-none text-xs px-1 text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* SEO Metadata Card */}
      <Card className="border-border/50 shadow-xl shadow-foreground/5">
        <CardHeader>
          <CardTitle>SEO Optimization</CardTitle>
          <CardDescription>Optimize details for search engines.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="meta_title" className="text-xs font-semibold uppercase tracking-wider">
                Meta Title
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onGenerateField("meta_title")}
                disabled={isGenerating}
                className="h-7 text-xs gap-1.5 text-primary hover:text-primary/80"
              >
                <Sparkles className="h-3 w-3" />
                AI Generate
              </Button>
            </div>
            <Input id="meta_title" {...register("meta_title")} placeholder="Optimal title for search engines" className="h-11" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="meta_description" className="text-xs font-semibold uppercase tracking-wider">
                Meta Description
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onGenerateField("meta_description")}
                disabled={isGenerating}
                className="h-7 text-xs gap-1.5 text-primary hover:text-primary/80"
              >
                <Sparkles className="h-3 w-3" />
                AI Generate
              </Button>
            </div>
            <Textarea id="meta_description" {...register("meta_description")} rows={3} placeholder="Brief description for search results..." className="resize-none" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StepReview({ data }: { data: any }) {
  const specs = (() => {
    if (!data.specifications) return {};
    if (typeof data.specifications === 'string') {
      try {
        return JSON.parse(data.specifications);
      } catch {
        return {};
      }
    }
    return data.specifications;
  })();

  const specEntries = Object.entries(specs);
  const tags = data.tags || [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Review & Publish</h2>
        <p className="text-muted-foreground mt-1">Review your product before publishing.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Product Details Card */}
        <Card className="border-border/50 shadow-xl shadow-foreground/5">
          <CardHeader>
            <CardTitle className="text-sm">Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Name", value: data.name },
              { label: "Slug", value: data.slug, mono: true },
              { label: "Brand", value: data.brand },
              { label: "Category", value: data.category_id }, // Would need to resolve to name
              { label: "Model Number", value: data.model_number },
              { label: "SKU", value: data.sku, mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {label}
                </Label>
                <p className={cn("text-sm font-medium", mono && "font-mono text-xs")}>
                  {value || <span className="text-muted-foreground italic">Not set</span>}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Descriptions Card */}
        <Card className="border-border/50 shadow-xl shadow-foreground/5">
          <CardHeader>
            <CardTitle className="text-sm">Descriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Short Description
              </Label>
              <p className="text-sm text-muted-foreground">
                {data.short_description || <span className="italic">Not set</span>}
              </p>
            </div>
            <Separator />
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Full Description
              </Label>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {data.description || <span className="italic">Not set</span>}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Card */}
        <Card className="border-border/50 shadow-xl shadow-foreground/5 overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-border/30">
            <CardTitle className="text-sm font-bold">Pricing Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Your Selling Price
              </Label>
              <p className="text-lg font-bold">{data.base_price ? `KES ${Number(data.base_price).toLocaleString()}` : <span className="text-muted-foreground italic">Not set</span>}</p>
            </div>

            {data.cost_price && (
              <>
                <Separator />
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Cost Price (KES)
                  </Label>
                  <p className="text-sm text-muted-foreground">{Number(data.cost_price).toLocaleString()}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Inventory Card */}
        <Card className="border-border/50 shadow-xl shadow-foreground/5">
          <CardHeader>
            <CardTitle className="text-sm">Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Track Inventory</Label>
              <Badge variant={data.track_inventory ? "default" : "secondary"}>
                {data.track_inventory ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Stock
                </Label>
                <p className="text-lg font-bold">{data.stock_quantity}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Low Stock Alert
                </Label>
                <p className="text-sm font-medium">{data.low_stock_threshold}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Weight (kg)
                </Label>
                <p className="text-sm font-medium">{data.weight_kg || <span className="italic">Not set</span>}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specifications Card (full width) */}
        <Card className="border-border/50 shadow-xl shadow-foreground/5 col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            {specEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No specifications</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {specEntries.map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {key}
                    </Label>
                    <p className="text-sm font-medium">{String(value)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEO Metadata Card (full width) */}
        <Card className="border-border/50 shadow-xl shadow-foreground/5 col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">SEO Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Meta Title
              </Label>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {data.meta_title || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            </div>
            <Separator />
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Meta Description
              </Label>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {data.meta_description || <span className="italic">Not set</span>}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tags Card (full width) */}
        <Card className="border-border/50 shadow-xl shadow-foreground/5 col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.length > 0 ? (
                tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="font-medium">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic">No tags</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-8 rounded-2xl bg-slate-950 text-white space-y-6">
        <h3 className="text-lg font-black flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Submission Confirmation
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed">
          By publishing this listing, you confirm that all medical certifications provided are valid and the equipment meets the safety standards for the selected region.
        </p>
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Ready for Admin Review</span>
        </div>
      </div>
    </div>
  );
}

// Import useFormContext at the top
import { useFormContext } from "react-hook-form";
