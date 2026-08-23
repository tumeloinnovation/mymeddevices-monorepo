"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Package,
  Plus,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  Search,
  Boxes,
  Percent,
  Layers,
  Sparkles,
  Tag,
  ShieldCheck,
  Building2,
  TrendingDown,
  Calculator,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Types
interface ProductOption {
  id: string;
  name: string;
  slug: string;
  price?: string;
  regular_price?: string;
  images?: Array<{ src: string }>;
  category?: { name: string };
  status: string;
  brand?: string;
  sku?: string;
}

interface BundleComponent {
  product_id: string;
  quantity: number;
  sort_order: number;
}

interface BundleFormData {
  name: string;
  slug: string;
  description: string;
  components: BundleComponent[];
  discount_type: "FIXED_AMOUNT" | "PERCENTAGE";
  discount_value: string;
  funding_source: "PLATFORM" | "VENDOR" | "MIXED";
  is_active: boolean;
}

const STEPS = [
  { id: 1, title: "Identity", description: "Name, slug & story", icon: Boxes },
  { id: 2, title: "Curated Items", description: "Add medical devices", icon: Layers },
  { id: 3, title: "Pricing & Savings", description: "Set discount model", icon: Calculator },
  { id: 4, title: "Storefront Preview", description: "Audit & launch bundle", icon: Sparkles },
];

export default function NewBundlePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [slugError, setSlugError] = useState("");
  const [slugEditMode, setSlugEditMode] = useState(false);

  const [formData, setFormData] = useState<BundleFormData>({
    name: "",
    slug: "",
    description: "",
    components: [],
    discount_type: "PERCENTAGE",
    discount_value: "15",
    funding_source: "PLATFORM",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || "";
    }
    return "";
  };

  // Fetch products using TanStack Query
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["catalog-products", productSearch],
    queryFn: async () => {
      const searchParam = productSearch ? `&search=${encodeURIComponent(productSearch)}` : "";
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/catalog/products?per_page=200&status_filter=published${searchParam}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      return data.products || [];
    },
  });

  const products = productsData || [];

  // Slug check mutation
  const slugCheckMutation = useMutation({
    mutationFn: async (slug: string) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/admin/bundles/slug/${slug}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      return response.ok;
    },
    onSuccess: (exists) => {
      if (exists) {
        setSlugError("This slug is already assigned to an existing bundle");
      } else {
        setSlugError("");
      }
    },
  });

  // Create bundle mutation
  const createBundleMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/admin/bundles/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Failed to create bundle");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Bundle created and published to storefront successfully!");
      router.push("/dashboard/marketing/bundles");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create bundle");
    },
  });

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p: any) => {
      if (p.category?.name) cats.add(p.category.name);
    });
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const matchesCat =
        selectedCategoryFilter === "all" ||
        p.category?.name === selectedCategoryFilter;

      return matchesCat;
    });
  }, [products, selectedCategoryFilter]);

  const preview = useMemo(() => {
    const componentCount = formData.components.reduce((sum, c) => sum + c.quantity, 0);
    const uniqueCount = formData.components.length;
    const grossTotal = formData.components.reduce((sum, comp) => {
      const product = products.find((p: any) => p.id === comp.product_id);
      if (product?.price) {
        return sum + parseFloat(product.price) * comp.quantity;
      }
      return sum;
    }, 0);

    const discountVal = parseFloat(formData.discount_value) || 0;
    const discountAmount =
      formData.discount_type === "PERCENTAGE"
        ? (grossTotal * Math.min(100, Math.max(0, discountVal))) / 100
        : Math.min(grossTotal, Math.max(0, discountVal));

    const netTotal = Math.max(0, grossTotal - discountAmount);
    const savingsPercent = grossTotal > 0 ? (discountAmount / grossTotal) * 100 : 0;

    return {
      componentCount,
      uniqueCount,
      grossTotal,
      discountAmount,
      netTotal,
      savingsPercent,
    };
  }, [formData.components, formData.discount_type, formData.discount_value, products]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Bundle name is required";
      if (!formData.slug.trim()) newErrors.slug = "URL slug is required";
      if (formData.slug.length < 3) newErrors.slug = "Slug must be at least 3 characters";
      if (!/^[a-z0-9-]+$/.test(formData.slug))
        newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
      if (slugError) newErrors.slug = slugError;
    }

    if (step === 2) {
      if (formData.components.length === 0)
        newErrors.components = "You must select at least one component product for this bundle";
    }

    if (step === 3) {
      const val = parseFloat(formData.discount_value);
      if (isNaN(val) || val <= 0) {
        newErrors.discount_value = "Discount value must be greater than 0";
      } else if (formData.discount_type === "PERCENTAGE" && val > 90) {
        newErrors.discount_value = "Percentage discount cannot exceed 90%";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleAddComponent = (productId: string) => {
    if (!productId) return;
    if (formData.components.some((c) => c.product_id === productId)) {
      toast.error("This item is already part of the bundle");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        {
          product_id: productId,
          quantity: 1,
          sort_order: prev.components.length,
        },
      ],
    }));
    setErrors((prev) => ({ ...prev, components: "" }));
    toast.success("Product added to bundle");
  };

  const handleRemoveComponent = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.filter((c) => c.product_id !== productId),
    }));
  };

  const handleComponentChange = (productId: string, field: "quantity", value: number) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.map((c) =>
        c.product_id === productId ? { ...c, [field]: value } : c
      ),
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100);
  };

  const handleNameChange = async (name: string) => {
    const newSlug = !slugEditMode ? generateSlug(name) : formData.slug;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: newSlug,
    }));
    if (!slugEditMode && newSlug.length >= 3) {
      slugCheckMutation.mutate(newSlug);
    }
  };

  const handleSlugChange = async (slug: string) => {
    setFormData((prev) => ({ ...prev, slug }));
    if (slug.length >= 3 && /^[a-z0-9-]+$/.test(slug)) {
      slugCheckMutation.mutate(slug);
    } else {
      setSlugError("");
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    const payload = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      funding_source: formData.funding_source,
      is_active: formData.is_active,
      components: formData.components.map((c, i) => ({
        product_id: c.product_id,
        quantity: c.quantity,
        sort_order: i,
      })),
    };

    createBundleMutation.mutate(payload);
  };

  const getProduct = (productId: string) => {
    return products.find((p: any) => p.id === productId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/dashboard/marketing/bundles")}
              className="h-10 w-10 rounded-xl shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Create Merchandising Bundle
                </h1>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold px-2.5 py-0.5">
                  V1 Engine
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Combine high-demand clinical equipment and supplies into a discounted, automated bundle kit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/marketing/bundles")}
              className="text-muted-foreground hover:text-foreground"
            >
              Discard
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-lg border text-xs">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-semibold text-foreground">
                {formData.is_active ? "Live on Storefront" : "Draft / Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Step Indicator Bar */}
        <div className="bg-card rounded-2xl border p-3 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    if (step.id < currentStep || validateStep(currentStep)) {
                      setCurrentStep(step.id);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2.5 p-2 rounded-lg text-left transition-all",
                    isCurrent
                      ? "bg-primary/10 border border-primary/30 shadow-xs"
                      : isCompleted
                      ? "bg-muted/40 hover:bg-muted border border-transparent"
                      : "opacity-60 hover:opacity-100 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-transform",
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                        : isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-[10px] font-semibold uppercase tracking-wider", isCurrent ? "text-primary font-bold" : "text-muted-foreground")}>
                      {step.id}
                    </p>
                    <p className="text-xs font-bold truncate text-foreground">{step.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Step Body (Left / Center) */}
          <div className="lg:col-span-8 space-y-6">
            {currentStep === 1 && (
              <Step1Identity
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                handleNameChange={handleNameChange}
                handleSlugChange={handleSlugChange}
                slugEditMode={slugEditMode}
                setSlugEditMode={setSlugEditMode}
                slugError={slugError}
                slugCheckIsPending={slugCheckMutation.isPending}
              />
            )}

            {currentStep === 2 && (
              <Step2Items
                formData={formData}
                products={filteredProducts}
                categories={categories}
                selectedCategory={selectedCategoryFilter}
                setSelectedCategory={setSelectedCategoryFilter}
                productsLoading={productsLoading}
                productSearch={productSearch}
                setProductSearch={setProductSearch}
                handleAddComponent={handleAddComponent}
                handleRemoveComponent={handleRemoveComponent}
                handleComponentChange={handleComponentChange}
                getProduct={getProduct}
                errors={errors}
              />
            )}

            {currentStep === 3 && (
              <Step3Pricing
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                preview={preview}
              />
            )}

            {currentStep === 4 && (
              <Step4StorefrontLaunch
                formData={formData}
                setFormData={setFormData}
                preview={preview}
                getProduct={getProduct}
                createBundleIsPending={createBundleMutation.isPending}
                handleSubmit={handleSubmit}
              />
            )}

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-between gap-4 pt-6 border-t">
              <Button
                variant="outline"
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="h-11 px-5 rounded-xl text-sm font-semibold"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous Step
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="h-11 px-7 rounded-xl text-sm font-bold shadow-md shadow-primary/20"
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createBundleMutation.isPending}
                  className="h-11 px-8 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                >
                  {createBundleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing Bundle...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Publish Bundle Live
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Persistent Live Simulator / Breakdown Card (Right Sidebar) */}
          <div className="lg:col-span-4 space-y-6 sticky top-6">
            <Card className="rounded-2xl border shadow-sm bg-gradient-to-b from-card to-muted/20 overflow-hidden">
              <CardHeader className="pb-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5 text-primary" />
                    Live Bundle Calculator
                  </span>
                  <Badge variant={formData.is_active ? "default" : "secondary"} className="text-[10px]">
                    {formData.is_active ? "Active" : "Draft"}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold text-foreground truncate mt-1">
                  {formData.name || "Untitled Bundle Kit"}
                </CardTitle>
                <CardDescription className="text-xs font-mono truncate">
                  /products/{formData.slug || "bundle-slug"}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {/* Visual Mini Stack of Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Selected Items</span>
                    <span>{preview.uniqueCount} products ({preview.componentCount} units)</span>
                  </div>

                  {formData.components.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed text-center bg-background/50">
                      <Layers className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1.5" />
                      <p className="text-xs text-muted-foreground">No devices selected yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {formData.components.map((comp) => {
                        const product = getProduct(comp.product_id);
                        if (!product) return null;
                        const lineGross = (parseFloat(product.price || "0") * comp.quantity);
                        return (
                          <div
                            key={comp.product_id}
                            className="flex items-center gap-2.5 p-2 rounded-lg bg-background border text-xs"
                          >
                            <div className="w-8 h-8 rounded-md bg-muted shrink-0 overflow-hidden relative">
                              {product.images?.[0] ? (
                                <Image
                                  src={product.images[0].src}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-muted-foreground m-auto" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground truncate">{product.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {comp.quantity} × Ksh {parseFloat(product.price || "0").toLocaleString()}
                              </p>
                            </div>
                            <span className="font-bold text-foreground shrink-0">
                              Ksh {lineGross.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Price Ledger */}
                <div className="p-4 rounded-xl bg-card border space-y-2.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Combined Regular Price</span>
                    <span className="font-medium text-foreground">
                      Ksh {preview.grossTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <TrendingDown className="h-3.5 w-3.5" />
                      Bundle Savings ({formData.discount_type === "PERCENTAGE" ? `${formData.discount_value}%` : "Fixed"})
                    </span>
                    <span>-Ksh {preview.discountAmount.toLocaleString()}</span>
                  </div>

                  <div className="pt-2 border-t flex justify-between items-baseline">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground block">Customer Bundle Price</span>
                      <span className="text-[10px] text-muted-foreground">
                        Funded by: <span className="font-semibold text-foreground uppercase">{formData.funding_source}</span>
                      </span>
                    </div>
                    <span className="text-xl font-extrabold text-primary">
                      Ksh {preview.netTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Value Callout */}
                {preview.savingsPercent > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      %{Math.round(preview.savingsPercent)}
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-emerald-950 dark:text-emerald-300">
                        {preview.savingsPercent.toFixed(1)}% Buyer Incentive
                      </p>
                      <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80">
                        Will appear with high-visibility badge across storefront.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <div className="p-4 rounded-2xl bg-muted/40 border text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                V1 Engine Rules
              </div>
              <p>
                Component products resolve through the automated Buy-Box engine to the best qualified vendor in Kenya without eroding vendor margin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ============================================================================
// STEP 1: IDENTITY
// ============================================================================
function Step1Identity({
  formData,
  setFormData,
  errors,
  handleNameChange,
  handleSlugChange,
  slugEditMode,
  setSlugEditMode,
  slugError,
  slugCheckIsPending,
}: any) {
  return (
    <Card className="rounded-2xl border shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Bundle Identity & Marketing</CardTitle>
            <CardDescription className="text-xs">
              Give your bundle kit a clear clinical purpose and search-friendly URL slug.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="b_name" className="text-sm font-semibold flex items-center justify-between">
              <span>Bundle Title *</span>
              <span className="text-[11px] text-muted-foreground font-normal">e.g. Clinic Starter Setup</span>
            </Label>
            <Input
              id="b_name"
              placeholder="e.g. Comprehensive Diabetes Management Kit"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={cn("h-11 rounded-xl", errors.name && "border-destructive focus-visible:ring-destructive")}
            />
            {errors.name && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="b_slug" className="text-sm font-semibold">Storefront URL Slug *</Label>
              {!slugEditMode && (
                <button
                  type="button"
                  onClick={() => setSlugEditMode(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Custom edit
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                id="b_slug"
                placeholder="diabetes-management-kit"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={!slugEditMode}
                className={cn(
                  "h-11 font-mono text-sm rounded-xl pl-3 pr-9",
                  !slugEditMode && "bg-muted/50 cursor-not-allowed",
                  (errors.slug || slugError) && "border-destructive"
                )}
              />
              {slugCheckIsPending && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {errors.slug && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.slug}</p>}
            {slugError && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{slugError}</p>}
            <p className="text-[11px] text-muted-foreground">
              Accessible to buyers at: <span className="font-mono text-foreground font-medium">/products/{formData.slug || "..."}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="b_desc" className="text-sm font-semibold flex items-center justify-between">
            <span>Clinical Overview & Story</span>
            <span className="text-[11px] text-muted-foreground font-normal">Displayed prominently on product details and mega-menu</span>
          </Label>
          <Textarea
            id="b_desc"
            rows={4}
            placeholder="Describe who this bundle is for (e.g. general practitioners, home caregivers, expectant mothers) and the medical rationale behind combining these specific devices..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="rounded-xl resize-none p-3.5 text-sm"
          />
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-foreground">Immediate Storefront Visibility</p>
            <p className="text-xs text-muted-foreground">
              When enabled, this bundle will appear in customer navigation, homepage bundles row, and category searches immediately upon creation.
            </p>
          </div>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// STEP 2: CURATED ITEMS SELECTOR
// ============================================================================
function Step2Items({
  formData,
  products,
  categories,
  selectedCategory,
  setSelectedCategory,
  productsLoading,
  productSearch,
  setProductSearch,
  handleAddComponent,
  handleRemoveComponent,
  handleComponentChange,
  getProduct,
  errors,
}: any) {
  return (
    <div className="space-y-6">
      {/* Selected Items Tray */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  Included Components ({formData.components.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Review and adjust quantities for each device in this package.
                </CardDescription>
              </div>
            </div>
            {formData.components.length > 0 && (
              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1">
                {formData.components.length} Items Selected
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {errors.components && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errors.components}
            </div>
          )}

          {formData.components.length === 0 ? (
            <div className="py-12 border border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6 bg-muted/20">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">No products added yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Use the product catalog below to search and add certified medical equipment to this bundle.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.components.map((comp: BundleComponent, idx: number) => {
                const product = getProduct(comp.product_id);
                if (!product) return null;
                const unitPrice = parseFloat(product.price || "0");
                const lineTotal = unitPrice * comp.quantity;

                return (
                  <div
                    key={comp.product_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card hover:border-primary/40 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>

                      <div className="w-14 h-14 rounded-xl bg-muted shrink-0 overflow-hidden relative border">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0].src}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-muted-foreground m-auto" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-foreground truncate">{product.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {product.category?.name && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {product.category.name}
                            </Badge>
                          )}
                          {product.brand && (
                            <span className="text-xs text-muted-foreground truncate">{product.brand}</span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-primary mt-1">
                          Ksh {unitPrice.toLocaleString()} / unit
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0">
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            handleComponentChange(
                              comp.product_id,
                              "quantity",
                              Math.max(1, comp.quantity - 1)
                            )
                          }
                        >
                          -
                        </Button>
                        <span className="w-9 text-center font-bold text-xs text-foreground">
                          {comp.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            handleComponentChange(
                              comp.product_id,
                              "quantity",
                              comp.quantity + 1
                            )
                          }
                        >
                          +
                        </Button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[100px]">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Line Total</p>
                        <p className="text-sm font-extrabold text-foreground">
                          Ksh {lineTotal.toLocaleString()}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveComponent(comp.product_id)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Catalog Search & Add Grid */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold">Catalog Browser</CardTitle>
              <CardDescription className="text-xs">
                Pick products to add to this bundle kit.
              </CardDescription>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[200px] flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search name, brand, SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className={cn(
                    "h-9 pl-8 pr-8 text-xs rounded-xl",
                    productsLoading && productSearch && "border-primary/50"
                  )}
                />
                {productsLoading && productSearch && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-primary" />
                )}
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 text-xs rounded-xl w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c: string) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0">
          {productsLoading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-4 w-4 animate-spin" />
              {productSearch ? `Searching for "${productSearch}"...` : "Loading catalog devices..."}
            </div>
          ) : products.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-xs">
              {productSearch ? (
                <>
                  <p>No products found matching "{productSearch}"</p>
                  <button
                    type="button"
                    onClick={() => setProductSearch("")}
                    className="mt-2 text-primary hover:underline font-semibold"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                "No products found matching the criteria."
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {products.map((product: ProductOption) => {
                const isSelected = formData.components.some(
                  (c: BundleComponent) => c.product_id === product.id
                );
                const price = parseFloat(product.price || "0");

                return (
                  <div
                    key={product.id}
                    className={cn(
                      "flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all",
                      isSelected
                        ? "bg-primary/5 border-primary/40 opacity-75"
                        : "bg-card hover:border-primary/50 hover:shadow-xs cursor-pointer"
                    )}
                    onClick={() => {
                      if (!isSelected) handleAddComponent(product.id);
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-muted shrink-0 overflow-hidden relative border">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0].src}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground m-auto" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{product.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {product.category?.name || "Equipment"} • {product.brand || "Certified"}
                        </p>
                        <p className="text-xs font-extrabold text-primary mt-0.5">
                          Ksh {price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? "outline" : "default"}
                      disabled={isSelected}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSelected) handleAddComponent(product.id);
                      }}
                      className="h-8 px-3 rounded-lg text-xs font-bold shrink-0"
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// STEP 3: PRICING & SAVINGS
// ============================================================================
function Step3Pricing({ formData, setFormData, errors, preview }: any) {
  return (
    <Card className="rounded-2xl border shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Discount Strategy & Funding</CardTitle>
            <CardDescription className="text-xs">
              Determine the customer price incentive and how the discount is absorbed.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        {/* Discount Type Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Discount Calculation Model</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, discount_type: "PERCENTAGE" })}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all",
                  formData.discount_type === "PERCENTAGE"
                    ? "bg-primary/10 border-primary font-bold shadow-xs text-primary"
                    : "bg-card hover:bg-muted text-muted-foreground"
                )}
              >
                <Percent className="h-5 w-5 mb-2" />
                <p className="text-sm font-bold text-foreground">Percentage Off</p>
                <p className="text-[11px] text-muted-foreground font-normal">e.g. 15% discount across all components</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, discount_type: "FIXED_AMOUNT" })}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all",
                  formData.discount_type === "FIXED_AMOUNT"
                    ? "bg-primary/10 border-primary font-bold shadow-xs text-primary"
                    : "bg-card hover:bg-muted text-muted-foreground"
                )}
              >
                <Tag className="h-5 w-5 mb-2" />
                <p className="text-sm font-bold text-foreground">Fixed Cash (Ksh)</p>
                <p className="text-[11px] text-muted-foreground font-normal">e.g. Ksh 2,500 total bundle savings</p>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="b_discount_value" className="text-sm font-semibold">
              Discount Amount ({formData.discount_type === "PERCENTAGE" ? "% Percentage" : "Kenyan Shillings (KES)"}) *
            </Label>
            <div className="relative">
              <Input
                id="b_discount_value"
                type="number"
                min="0"
                step={formData.discount_type === "PERCENTAGE" ? "1" : "100"}
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                className={cn("h-11 rounded-xl text-base font-bold", errors.discount_value && "border-destructive")}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                {formData.discount_type === "PERCENTAGE" ? "% OFF" : "KES"}
              </span>
            </div>
            {errors.discount_value && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.discount_value}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Customer saves <span className="font-bold text-emerald-600">Ksh {preview.discountAmount.toLocaleString()}</span> on this package.
            </p>
          </div>
        </div>

        {/* Funding Model */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Subsidy & Funding Source</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: "PLATFORM",
                title: "Platform Subsidized (Recommended)",
                desc: "MyMedDevices marketing budget covers the discount. Vendor gets full payout.",
                icon: ShieldCheck,
              },
              {
                id: "VENDOR",
                title: "Vendor Absorbed",
                desc: "Vendor partner agrees to margin reduction for volume sales.",
                icon: Building2,
              },
              {
                id: "MIXED",
                title: "Co-Funded (50/50)",
                desc: "Shared equally between platform promotion and vendor discount.",
                icon: RefreshCw,
              },
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = formData.funding_source === f.id;

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, funding_source: f.id as any })}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all flex flex-col justify-between",
                    isSelected
                      ? "bg-primary/10 border-primary shadow-xs"
                      : "bg-card hover:bg-muted"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <p className="text-xs font-bold text-foreground">{f.title}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{f.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// STEP 4: REVIEW & STOREFRONT LAUNCH
// ============================================================================
function Step4StorefrontLaunch({
  formData,
  setFormData,
  preview,
  getProduct,
  createBundleIsPending,
  handleSubmit,
}: any) {
  return (
    <div className="space-y-6">
      {/* Storefront Card Simulation Preview */}
      <Card className="rounded-2xl border shadow-md overflow-hidden bg-card">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-bold">Storefront Live Preview</CardTitle>
            </div>
            <Badge className="bg-emerald-600 text-white font-bold text-xs">
              Save {Math.round(preview.savingsPercent)}%
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Here is how your bundle card will appear to healthcare customers on the homepage row and navigation.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Overlapping Component Badges */}
            <div className="md:col-span-5 flex items-center justify-center p-6 rounded-2xl bg-muted/40 border">
              <div className="flex -space-x-4 overflow-hidden py-2">
                {formData.components.slice(0, 4).map((comp: BundleComponent, idx: number) => {
                  const product = getProduct(comp.product_id);
                  return (
                    <div
                      key={comp.product_id}
                      className="inline-block h-16 w-16 rounded-2xl ring-4 ring-card bg-muted overflow-hidden relative shadow-md"
                      title={product?.name}
                    >
                      {product?.images?.[0] ? (
                        <Image
                          src={product.images[0].src}
                          alt={product.name || "item"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground m-auto" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content Details */}
            <div className="md:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
                <Boxes className="h-3 w-3" />
                <span>Curated Healthcare Kit</span>
              </div>

              <h3 className="text-xl font-extrabold text-foreground leading-snug">
                {formData.name || "Clinical Equipment Bundle"}
              </h3>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {formData.description ||
                  `Complete medical set containing ${formData.components.length} certified items with synchronized warranty.`}
              </p>

              <div className="pt-2 flex items-baseline gap-3">
                <span className="text-2xl font-extrabold text-primary">
                  Ksh {preview.netTotal.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  Ksh {preview.grossTotal.toLocaleString()}
                </span>
                <Badge variant="outline" className="text-xs font-bold text-emerald-600 bg-emerald-500/10 border-emerald-500/30">
                  Save Ksh {preview.discountAmount.toLocaleString()}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Audit List */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold">Bundle Inventory Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="divide-y text-xs">
            {formData.components.map((c: BundleComponent, i: number) => {
              const p = getProduct(c.product_id);
              if (!p) return null;
              const unit = parseFloat(p.price || "0");
              return (
                <div key={c.product_id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center font-bold text-[10px]">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-foreground truncate max-w-[240px] sm:max-w-md">
                      {p.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground mr-3">Qty: {c.quantity}</span>
                    <span className="font-bold text-foreground">
                      Ksh {(unit * c.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

