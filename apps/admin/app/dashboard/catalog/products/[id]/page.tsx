"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImageIcon,
  Upload,
  Sparkles,
  Activity,
  ShoppingCart,
  Zap,
  Globe,
  Settings2,
  FileText,
  Clock,
  Archive,
  XCircle,
  Package,
  ArrowRight,
  ShieldCheck,
  Percent,
  DollarSign,
  Ruler,
  Scale,
  ListChecks,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Product, ProductStatus } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  useProduct,
  useProductCompleteness,
  useProductCategories,
  useProductMutations,
  useImageMutations,
  useAIGenerate,
  useAIValidate,
  useVendorsOverview,
  findVendorName,
} from "./_hooks/use-product-detail";
import {
  Field,
  TextView,
  MonoView,
  BadgeView,
  BrandView,
  PriceView,
  ComparePriceView,
  StockView,
  CertificationsView,
  TagsView,
  JsonView,
  DescriptionView,
  SlugView,
  TimestampView,
  SpecificationsView,
  SpecificationsEditor,
  DimensionsView,
} from "./_components/product-form-fields";

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  draft: {
    label: "Draft",
    icon: FileText,
    color: "text-gray-700 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-900/40",
    border: "border-gray-200 dark:border-gray-800",
  },
  pending_review: {
    label: "Pending Review",
    icon: Clock,
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  published: {
    label: "Published",
    icon: CheckCircle2,
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    color: "text-slate-700 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-800",
  },
};

function StatusBadge({ status }: { status: ProductStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={`${cfg.bg} ${cfg.color} ${cfg.border} flex w-fit items-center gap-1 font-semibold px-2.5 py-0.5 text-[10px] rounded-full`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label.toUpperCase()}
    </Badge>
  );
}

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1),
  description: z.string().default(""),
  short_description: z.string().default(""),
  sku: z.string().default(""),
  category_id: z.string().default(""),
  brand: z.string().default(""),
  model_number: z.string().default(""),
  price: z.coerce.number().optional(),
  cost_price: z.coerce.number().optional(),
  base_price: z.coerce.number().optional(),
  stock_quantity: z.coerce.number().default(0),
  low_stock_threshold: z.coerce.number().default(5),
  track_inventory: z.boolean().default(true),
  weight_kg: z.coerce.number().optional(),
  dimensions_length: z.string().default(""),
  dimensions_width: z.string().default(""),
  dimensions_height: z.string().default(""),
  dimensions_unit: z.string().default("cm"),
  specifications: z.string().default(""),
  certifications: z.string().default(""),
  kmpdb_registration_number: z.string().default(""),
  ppb_classification: z.string().default(""),
  ce_marking_or_fda_clearance: z.string().default(""),
  warranty_info: z.string().default(""),
  meta_title: z.string().default(""),
  meta_description: z.string().default(""),
  tags: z.string().default(""),
});

type ProductFormValues = z.infer<typeof productSchema>;

function productToFormValues(p: Product): ProductFormValues {
  return {
    name: p.name,
    slug: p.slug,
    description: p.description || "",
    short_description: p.short_description || "",
    sku: p.sku || "",
    category_id: p.category_id || "",
    brand: p.brand || "",
    model_number: p.model_number || "",
    price: p.price ?? undefined,
    cost_price: p.cost_price ?? undefined,
    base_price: p.base_price ?? undefined,
    stock_quantity: p.stock_quantity ?? 0,
    low_stock_threshold: p.low_stock_threshold ?? 5,
    track_inventory: p.track_inventory ?? true,
    weight_kg: p.weight_kg ?? undefined,
    dimensions_length: p.dimensions?.length?.toString() || "",
    dimensions_width: p.dimensions?.width?.toString() || "",
    dimensions_height: p.dimensions?.height?.toString() || "",
    dimensions_unit: p.dimensions?.unit || "cm",
    specifications: JSON.stringify(p.specifications || {}, null, 2),
    certifications: (p.certifications || []).join(", "),
    kmpdb_registration_number: p.kmpdb_registration_number || "",
    ppb_classification: p.ppb_classification || "",
    ce_marking_or_fda_clearance: p.ce_marking_or_fda_clearance || "",
    warranty_info: p.warranty_info || "",
    meta_title: p.meta_title || "",
    meta_description: p.meta_description || "",
    tags: (p.tags || []).join(", "),
  };
}

function toOptionalNumber(val: any): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}

function formValuesToPayload(values: ProductFormValues): Partial<Product> {
  let specs: Record<string, unknown> | undefined;
  if (values.specifications) {
    try {
      specs = JSON.parse(values.specifications);
    } catch {
      return {};
    }
  }

  return {
    name: values.name,
    slug: values.slug,
    description: values.description || undefined,
    short_description: values.short_description || undefined,
    sku: values.sku || undefined,
    category_id: values.category_id || undefined,
    brand: values.brand || undefined,
    model_number: values.model_number || undefined,
    price: toOptionalNumber(values.price),
    cost_price: toOptionalNumber(values.cost_price),
    base_price: toOptionalNumber(values.base_price),
    currency: "KES",
    stock_quantity: values.stock_quantity !== undefined ? Number(values.stock_quantity) : 0,
    low_stock_threshold: values.low_stock_threshold !== undefined ? Number(values.low_stock_threshold) : 5,
    track_inventory: values.track_inventory,
    weight_kg: toOptionalNumber(values.weight_kg),
    dimensions: (values.dimensions_length || values.dimensions_width || values.dimensions_height) ? {
      length: values.dimensions_length ? parseFloat(values.dimensions_length) : 0,
      width: values.dimensions_width ? parseFloat(values.dimensions_width) : 0,
      height: values.dimensions_height ? parseFloat(values.dimensions_height) : 0,
      unit: values.dimensions_unit || "cm"
    } : undefined,
    specifications: specs,
    certifications: values.certifications
      ? values.certifications.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    kmpdb_registration_number: values.kmpdb_registration_number || undefined,
    ppb_classification: (values.ppb_classification as any) || undefined,
    ce_marking_or_fda_clearance: values.ce_marking_or_fda_clearance || undefined,
    warranty_info: values.warranty_info || undefined,
    meta_title: values.meta_title || undefined,
    meta_description: values.meta_description || undefined,
    tags: values.tags
      ? values.tags.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
  };
}

function formatCurrency(amount: number, currency = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE")}`;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeGalleryImageIndex, setActiveGalleryImageIndex] = useState(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const { data: product, isLoading, error } = useProduct(productId);
  const { data: completeness } = useProductCompleteness(productId);
  const { data: categories = [] } = useProductCategories();
  const { data: vendors = [] } = useVendorsOverview();
  const mutations = useProductMutations(productId);
  const imageMutations = useImageMutations(productId);
  const aiGen = useAIGenerate(productId);
  const aiValidate = useAIValidate(productId);

  const form = useForm<ProductFormValues>({
    resolver: standardSchemaResolver(productSchema) as any,
    defaultValues: productToFormValues(product ?? ({} as Product)),
  });

  useEffect(() => {
    if (product) form.reset(productToFormValues(product));
  }, [product, form]);

  const handleSave = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) return toast.error("Please fix the form errors before saving.");

    const values = form.getValues();
    const payload = formValuesToPayload(values);

    if (payload.specifications === undefined && values.specifications) {
      return toast.error("Invalid JSON in specifications field.");
    }

    mutations.update.mutate(payload, {
      onSuccess: () => setIsEditing(false),
    });
  }, [form, mutations.update]);

  const handleStatusAction = useCallback(
    (action: "verify" | "publish" | "archive") => {
      const m = mutations[action];
      m.mutate();
    },
    [mutations]
  );

  const handleRejectSubmit = useCallback(() => {
    if (!rejectionReason.trim()) return;
    mutations.reject.mutate(
      { id: productId, reason: rejectionReason },
      {
        onSuccess: () => {
          setShowRejectDialog(false);
          setRejectionReason("");
        },
      }
    );
  }, [productId, rejectionReason, mutations.reject]);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      imageMutations.upload.mutate({
        file,
        isPrimary: !product?.images?.length,
      });
      e.target.value = "";
    },
    [imageMutations.upload, product]
  );

  const handleAIClick = useCallback(() => {
    if (!isEditing) return;
    aiGen.mutate(undefined, {
      onSuccess: (data) => {
        if (data.suggestions) {
          if (data.suggestions.description) form.setValue("description", data.suggestions.description);
          if (data.suggestions.short_description) form.setValue("short_description", data.suggestions.short_description);
          if (data.suggestions.meta_title) form.setValue("meta_title", data.suggestions.meta_title);
          if (data.suggestions.meta_description) form.setValue("meta_description", data.suggestions.meta_description);
          toast.success("AI content generated. Review and save.");
        }
      },
    });
  }, [aiGen, form, isEditing]);

  const isSaving =
    mutations.update.isPending ||
    mutations.verify.isPending ||
    mutations.publish.isPending ||
    mutations.archive.isPending ||
    mutations.delete.isPending ||
    imageMutations.upload.isPending ||
    imageMutations.remove.isPending ||
    aiValidate.isPending;

  const vendorName =
    product && findVendorName(product.vendor_id, vendors);

  // Live Margins calculation
  const watchedPrice = form.watch("price") || 0;
  const watchedBasePrice = form.watch("base_price") || 0;
  const watchedCostPrice = form.watch("cost_price") || 0;

  const markupAmount = watchedPrice > watchedBasePrice ? watchedPrice - watchedBasePrice : 0;
  const markupPercent = watchedBasePrice > 0 ? (markupAmount / watchedBasePrice) * 100 : 0;

  const vendorMarginAmount = watchedBasePrice > watchedCostPrice ? watchedBasePrice - watchedCostPrice : 0;
  const vendorMarginPercent = watchedBasePrice > 0 ? (vendorMarginAmount / watchedBasePrice) * 100 : 0;

  const totalMarkupAmount = watchedPrice > watchedCostPrice ? watchedPrice - watchedCostPrice : 0;
  const totalMarkupPercent = watchedCostPrice > 0 ? (totalMarkupAmount / watchedCostPrice) * 100 : 0;

  // SEO progress calculations
  const watchedMetaTitle = form.watch("meta_title") || "";
  const watchedMetaDesc = form.watch("meta_description") || "";

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
          <Skeleton className="h-8 w-40 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-[250px] w-full rounded-2xl" />
              <Skeleton className="h-[120px] w-full rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-[200px] w-full rounded-2xl" />
              <Skeleton className="h-[80px] w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !product) return null;

  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const activeImage = product.images?.[activeGalleryImageIndex] || primaryImage;

  // Complete Audit Timeline / Checklist
  const checklistItems = [
    { label: "Core Name & Slug Set", isCompleted: !!product.name && !!product.slug },
    { label: "Pricing Configured", isCompleted: !!product.price && product.price > 0 },
    { label: "Clinical Narrative Defined", isCompleted: !!product.description && product.description.length > 50 },
    { label: "Technical Specifications Set", isCompleted: !!product.specifications && Object.keys(product.specifications).length > 0 },
    { label: "Certifications Listed", isCompleted: !!product.certifications && product.certifications.length > 0 },
    { label: "Clinical Image Gallery Uploaded", isCompleted: !!product.images && product.images.length > 0 },
    { label: "SEO Meta Tags Optimized", isCompleted: !!product.meta_title && !!product.meta_description },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1600px] mx-auto">
        
        {/* Header Block */}
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between bg-card border border-border/80 rounded-2xl p-4 md:p-5 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-muted/40 border border-border flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
              {primaryImage ? (
                <img
                  src={primaryImage.url}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <Package className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground/30" />
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-foreground truncate">
                  {product.name}
                </h1>
                <StatusBadge status={product.status} />
              </div>
              <div className="flex items-center gap-2 md:gap-3 text-[11px] md:text-xs text-muted-foreground">
                <MonoView className="truncate">{product.sku || "NO-SKU"}</MonoView>
                {vendorName && (
                  <span className="flex items-center gap-1 font-medium truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span className="truncate">{vendorName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end">
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" className="h-9 text-xs rounded-xl font-semibold border-border hover:bg-muted active:scale-[0.97] transition-all duration-150" asChild>
                  <a
                    href={`${process.env.NEXT_PUBLIC_CUSTOMER_URL || "http://localhost:3000"}/products/${product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Listing
                  </a>
                </Button>
                {product.status === "published" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs rounded-xl font-semibold border-border text-slate-600 hover:bg-muted active:scale-[0.97] transition-all duration-150"
                    onClick={() => handleStatusAction("archive")}
                    disabled={isSaving}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-9 text-xs rounded-xl font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm active:scale-[0.97] transition-all duration-150"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Product
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs rounded-xl font-semibold text-destructive border-destructive/10 hover:bg-destructive/5 active:scale-[0.97] transition-all duration-150"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs rounded-xl font-semibold border-border active:scale-[0.97] transition-all duration-150"
                  onClick={() => {
                    setIsEditing(false);
                    form.reset(productToFormValues(product));
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-9 text-xs rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-[0.97] transition-all duration-150"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        {(!product.images || product.images.length === 0) && (
          <div className="p-3 md:p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex gap-3 items-center">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                  Missing Clinical Images
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 font-medium leading-relaxed">
                  This product has no clinical images uploaded. Listings require at least one image to be approved.
                </p>
              </div>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-500/20 rounded-xl flex-shrink-0 active:scale-[0.97] transition-all duration-150 self-start sm:self-auto"
                onClick={() => {
                  setIsEditing(true);
                  setActiveTab("media");
                }}
              >
                Upload Now
              </Button>
            )}
          </div>
        )}

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

          {/* Left / Main Workspace */}
          <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6 order-2 lg:order-1">
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-muted/60 p-1 h-10 md:h-11 rounded-xl w-full justify-start overflow-x-auto overflow-y-hidden border gap-1 scrollbar-thin">
                <TabsTrigger
                  value="general"
                  className="px-3 md:px-4 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] md:text-xs font-semibold tracking-wide transition-all duration-150 whitespace-nowrap"
                >
                  General
                </TabsTrigger>
                <TabsTrigger
                  value="pricing"
                  className="px-3 md:px-4 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] md:text-xs font-semibold tracking-wide transition-all duration-150 whitespace-nowrap"
                >
                  Pricing
                </TabsTrigger>
                <TabsTrigger
                  value="technical"
                  className="px-3 md:px-4 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] md:text-xs font-semibold tracking-wide transition-all duration-150 whitespace-nowrap"
                >
                  Specs
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className="px-3 md:px-4 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] md:text-xs font-semibold tracking-wide transition-all duration-150 whitespace-nowrap"
                >
                  Media
                </TabsTrigger>
                <TabsTrigger
                  value="seo"
                  className="px-3 md:px-4 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] md:text-xs font-semibold tracking-wide transition-all duration-150 whitespace-nowrap"
                >
                  SEO
                </TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="mt-6 flex flex-col gap-6 focus-visible:outline-none">
                
                {/* Visual specsheet gallery when not editing */}
                {!isEditing && product.images && product.images.length > 0 && (
                  <Card className="overflow-hidden border border-border/80 shadow-sm rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6">

                      {/* Active image and slider thumbnails */}
                      <div className="flex flex-col gap-3 md:gap-4">
                        <div className="aspect-square w-full rounded-2xl overflow-hidden border border-border/60 bg-muted/20 relative group">
                          <img
                            src={activeImage.url}
                            alt={activeImage.alt_text || "Clinical device image"}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {activeImage.is_primary && (
                            <div className="absolute top-3 left-3 bg-primary text-[9px] font-bold text-white px-2 py-1 rounded-full uppercase tracking-wider shadow">
                              Primary Image
                            </div>
                          )}
                        </div>
                        {product.images.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                            {product.images.map((img, idx) => (
                              <button
                                key={img.id}
                                onClick={() => setActiveGalleryImageIndex(idx)}
                                className={cn(
                                  "relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden border-2 bg-muted/10 transition-all select-none active:scale-95 flex-shrink-0",
                                  activeGalleryImageIndex === idx ? "border-primary shadow" : "border-border/60 hover:border-muted-foreground/30"
                                )}
                              >
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Side quick specifications overview */}
                      <div className="flex flex-col justify-center md:justify-between py-1 gap-3 md:gap-4">
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="bg-primary/5 text-primary border border-primary/10 rounded-lg px-2.5 py-1 text-[11px] font-bold">
                              {product.category_name || "Uncategorized"}
                            </Badge>
                            {product.brand && (
                              <Badge variant="outline" className="rounded-lg border-border/80 text-muted-foreground px-2.5 py-1 text-[11px] font-bold">
                                {product.brand.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-2">
                            <h2 className="text-xl font-extrabold text-foreground">{product.name}</h2>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                              {product.short_description || "No short description provided. Add one under the details section below."}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-dashed border-border pt-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Model</span>
                            <p className="text-sm font-semibold text-foreground mt-0.5">{product.model_number || "—"}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Regulatory status</span>
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {product.ce_marking_or_fda_clearance ? "Clearance Active" : "No Clearance Record"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Primary specs fields */}
                <Card className="border border-border/80 shadow-sm rounded-2xl">
                  <CardHeader className="bg-muted/10 border-b p-5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Essential Product Information
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Define device nomenclature, catalog mapping, and marketing copies.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                      <Field
                        label="Product Name"
                        editing={isEditing}
                        view={<TextView>{product.name}</TextView>}
                      >
                        <Input
                          {...form.register("name")}
                          className="h-10 text-sm focus-visible:ring-primary"
                        />
                      </Field>
                      <Field
                        label="Storefront URL Slug"
                        editing={isEditing}
                        view={<SlugView slug={product.slug} />}
                      >
                        <Input
                          {...form.register("slug")}
                          className="h-10 text-xs font-mono focus-visible:ring-primary"
                        />
                      </Field>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                      <Field
                        label="Catalog Category"
                        editing={isEditing}
                        view={
                          <BadgeView>
                            {product.category_name || "Uncategorized"}
                          </BadgeView>
                        }
                      >
                        <Select
                          value={form.watch("category_id")}
                          onValueChange={(v) =>
                            form.setValue("category_id", v)
                          }
                        >
                          <SelectTrigger className="h-10 text-xs focus-visible:ring-primary">
                            <SelectValue placeholder="Assign category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id} className="text-xs">
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field
                        label="Brand (Manufacturer)"
                        editing={isEditing}
                        view={<BrandView name={product.brand} />}
                      >
                        <Input
                          {...form.register("brand")}
                          className="h-10 text-sm focus-visible:ring-primary"
                        />
                      </Field>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                      <Field
                        label="Model Number"
                        editing={isEditing}
                        view={<TextView>{product.model_number}</TextView>}
                      >
                        <Input
                          {...form.register("model_number")}
                          className="h-10 text-sm focus-visible:ring-primary"
                        />
                      </Field>
                      <Field
                        label="Regulatory Clearances"
                        editing={isEditing}
                        view={<CertificationsView certs={product.certifications} />}
                      >
                        <Input
                          {...form.register("certifications")}
                          placeholder="ISO 13485, CE 0123, FDA Class II..."
                          className="h-10 text-sm focus-visible:ring-primary"
                        />
                      </Field>
                    </div>

                    <Separator />

                    <Field
                      label="Short Tagline (Brief Overview)"
                      editing={isEditing}
                      view={
                        <DescriptionView
                          text={product.short_description}
                          placeholder="No short tagline defined."
                        />
                      }
                    >
                      <Textarea
                        {...form.register("short_description")}
                        rows={2}
                        placeholder="A concise, informative tagline for search results and previews."
                        className="text-sm resize-none focus-visible:ring-primary"
                      />
                    </Field>

                    <Field
                      label="Complete Clinical Narrative"
                      editing={isEditing}
                      view={
                        <DescriptionView
                          text={product.description}
                          placeholder="Full marketing/clinical narrative not yet defined."
                        />
                      }
                    >
                      <Textarea
                        {...form.register("description")}
                        rows={6}
                        placeholder="Comprehensive specifications overview, clinical context, and details..."
                        className="text-sm resize-none focus-visible:ring-primary"
                      />
                    </Field>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pricing & Stock Tab */}
              <TabsContent value="pricing" className="mt-4 md:mt-6 flex flex-col gap-4 md:gap-6 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6">

                  {/* Pricing Architecture */}
                  <Card className="border border-border/80 shadow-sm rounded-2xl md:col-span-1 lg:col-span-7">
                    <CardHeader className="bg-primary/5 border-b p-5">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                        <ShoppingCart className="h-4 w-4" />
                        Pricing Architecture
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Configure transactional metrics, retail prices, wholesale bases, and vendor costs.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <Field
                          label="Retail Price (KES)"
                          editing={isEditing}
                          view={<PriceView value={product.price} currency={product.currency} />}
                        >
                          <Input
                            type="number"
                            {...form.register("price")}
                            className="h-10 text-sm focus-visible:ring-primary"
                          />
                        </Field>
                        <Field
                          label="Base wholesale Price (KES)"
                          editing={isEditing}
                          view={<PriceView value={product.base_price} currency={product.currency} />}
                        >
                          <Input
                            type="number"
                            {...form.register("base_price")}
                            className="h-10 text-sm focus-visible:ring-primary"
                          />
                        </Field>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Field
                          label="Vendor Cost Price (KES)"
                          editing={isEditing}
                          view={
                            product.cost_price ? (
                              <p className="text-base font-bold text-foreground">
                                {formatCurrency(product.cost_price, product.currency)}
                              </p>
                            ) : (
                              <TextView>—</TextView>
                            )
                          }
                        >
                          <Input
                            type="number"
                            {...form.register("cost_price")}
                            className="h-10 text-sm focus-visible:ring-primary"
                          />
                        </Field>
                        <div className="flex flex-col justify-end">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Currency Code</span>
                          <p className="h-10 flex items-center text-sm font-bold text-foreground bg-muted/40 border rounded-lg px-3 mt-1.5">
                            {product.currency}
                          </p>
                        </div>
                      </div>

                      {/* Margin Analysis Panel (Interactive widget) */}
                      <div className="border border-border/80 bg-muted/20 rounded-2xl p-5 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                          <Percent className="h-3.5 w-3.5 text-primary" />
                          Platform Margin Analysis
                        </h4>
                        
                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Platform Markup (Customer Markup)</span>
                            <div className="text-right">
                              <span className="font-bold text-foreground">KES {markupAmount.toLocaleString("en-KE")}</span>
                              <span className="text-emerald-600 font-semibold ml-1.5">+{markupPercent.toFixed(1)}%</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Vendor Profit Margin (Base vs Cost)</span>
                            <div className="text-right">
                              <span className="font-bold text-foreground">KES {vendorMarginAmount.toLocaleString("en-KE")}</span>
                              <span className="text-indigo-600 font-semibold ml-1.5">+{vendorMarginPercent.toFixed(1)}%</span>
                            </div>
                          </div>

                          <Separator className="border-dashed" />

                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-foreground">Total Spread (Retail vs Cost)</span>
                            <div className="text-right">
                              <span className="text-primary font-extrabold">KES {totalMarkupAmount.toLocaleString("en-KE")}</span>
                              <span className="text-primary font-black ml-1.5">+{totalMarkupPercent.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Inventory & Stock */}
                  <Card className="border border-border/80 shadow-sm rounded-2xl md:col-span-1 lg:col-span-5 flex flex-col justify-between">
                    <div>
                      <CardHeader className="bg-amber-500/5 border-b p-4 md:p-5">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600">
                          <Zap className="h-4 w-4" />
                          Inventory &amp; Stock
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Track product storage level, thresholds, and inventory states.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <Field
                            label="Stock Count"
                            editing={isEditing}
                            view={<StockView quantity={product.stock_quantity} />}
                          >
                            <Input
                              type="number"
                              {...form.register("stock_quantity")}
                              className="h-10 text-sm focus-visible:ring-primary"
                            />
                          </Field>
                          <Field
                            label="Low Stock Alert"
                            editing={isEditing}
                            view={
                              <p className="text-sm font-bold">
                                {product.low_stock_threshold ?? 5} Units
                              </p>
                            }
                          >
                            <Input
                              type="number"
                              {...form.register("low_stock_threshold")}
                              className="h-10 text-sm focus-visible:ring-primary"
                            />
                          </Field>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between py-1 bg-muted/10 p-3 rounded-xl border border-dashed">
                          <div className="space-y-0.5">
                            <Label className="text-xs font-bold text-foreground">Track Inventory</Label>
                            <p className="text-[10px] text-muted-foreground">Enables alert notification thresholds</p>
                          </div>
                          <Switch
                            checked={form.watch("track_inventory")}
                            onCheckedChange={(checked) =>
                              form.setValue("track_inventory", checked)
                            }
                            disabled={!isEditing}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>
                      </CardContent>
                    </div>

                    <div className="p-6 border-t bg-muted/10 rounded-b-2xl">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Live Stock Status:</span>
                        <Badge className={cn(
                          "rounded-lg font-bold px-2 py-0.5 text-[10px]",
                          product.stock_quantity === 0 ? "bg-red-500/10 text-red-700 border-red-200" :
                          product.stock_quantity <= (product.low_stock_threshold || 5) ? "bg-amber-500/10 text-amber-700 border-amber-200" :
                          "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                        )}>
                          {product.stock_quantity === 0 ? "OUT OF STOCK" :
                           product.stock_quantity <= (product.low_stock_threshold || 5) ? "LOW STOCK ALERT" :
                           "IN STOCK"}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Technical Specifications Tab */}
              <TabsContent value="technical" className="mt-4 md:mt-6 flex flex-col gap-4 md:gap-6 focus-visible:outline-none">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6">

                  {/* Left Specs */}
                  <Card className="border border-border/80 shadow-sm rounded-2xl md:col-span-1 lg:col-span-7">
                    <CardHeader className="bg-indigo-500/5 border-b p-4 md:p-5">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600">
                        <Settings2 className="h-4 w-4" />
                        Clinical Configuration Specifications
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Structured technical metrics displayed in dynamic lists.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                      <Field
                        label="Technical Specifications Schema"
                        editing={isEditing}
                        view={<SpecificationsView data={product.specifications || {}} />}
                      >
                        <SpecificationsEditor form={form} />
                      </Field>
                    </CardContent>
                  </Card>

                  {/* Right Compliance details */}
                  <Card className="border border-border/80 shadow-sm rounded-2xl md:col-span-1 lg:col-span-5">
                    <CardHeader className="bg-violet-500/5 border-b p-4 md:p-5">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-violet-600">
                        <ShieldCheck className="h-4 w-4" />
                        Compliance &amp; Clearance
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Regulatory details and physical device metrics.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Field
                          label="PPB Classification"
                          editing={isEditing}
                          view={
                            <Badge variant="secondary" className="rounded-lg text-xs font-semibold bg-muted">
                              {product.ppb_classification || "Unclassified"}
                            </Badge>
                          }
                        >
                          <Select
                            value={form.watch("ppb_classification") || ""}
                            onValueChange={(v) => form.setValue("ppb_classification", v)}
                          >
                            <SelectTrigger className="h-10 text-xs focus-visible:ring-primary">
                              <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Class A" className="text-xs">Class A (Low Risk)</SelectItem>
                              <SelectItem value="Class B" className="text-xs">Class B (Low-Med Risk)</SelectItem>
                              <SelectItem value="Class C" className="text-xs">Class C (Med-High Risk)</SelectItem>
                              <SelectItem value="Class D" className="text-xs">Class D (High Risk)</SelectItem>
                              <SelectItem value="Unclassified" className="text-xs">Unclassified</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>

                        <Field
                          label="CE/FDA Clearance Ref"
                          editing={isEditing}
                          view={<TextView>{product.ce_marking_or_fda_clearance}</TextView>}
                        >
                          <Input
                            {...form.register("ce_marking_or_fda_clearance")}
                            className="h-10 text-sm focus-visible:ring-primary"
                          />
                        </Field>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <Field
                          label="KMPDB Registration ID"
                          editing={isEditing}
                          view={<TextView>{product.kmpdb_registration_number}</TextView>}
                        >
                          <Input
                            {...form.register("kmpdb_registration_number")}
                            className="h-10 text-sm focus-visible:ring-primary"
                          />
                        </Field>
                      </div>

                      <Separator />

                      {/* Advanced Settings Toggle */}
                      <div className="flex items-center justify-between py-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                          Advanced Settings
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                          className="h-8 px-3 text-xs"
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              showAdvancedSettings && "rotate-180"
                            )}
                          />
                          {showAdvancedSettings ? "Hide" : "Show"}
                        </Button>
                      </div>

                      {showAdvancedSettings && (
                        <>
                          <Separator />

                          <div className="grid grid-cols-2 gap-4">
                            <Field
                              label="Device Weight (kg)"
                              editing={isEditing}
                              view={<TextView>{product.weight_kg ? `${product.weight_kg} kg` : "—"}</TextView>}
                            >
                              <Input
                                type="number"
                                step="0.01"
                                {...form.register("weight_kg")}
                                className="h-10 text-sm focus-visible:ring-primary"
                              />
                            </Field>
                          </div>

                          <Separator />

                          {/* Physical Dimensions */}
                          <div className="space-y-3">
                            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">Dimensions (L × W × H)</Label>
                            {!isEditing ? (
                              <DimensionsView dimensions={product.dimensions} />
                            ) : (
                              <div className="flex gap-2 items-center">
                                <Input
                                  placeholder="L"
                                  {...form.register("dimensions_length")}
                                  className="h-9 text-xs focus-visible:ring-primary flex-1"
                                />
                                <span className="text-xs text-muted-foreground">×</span>
                                <Input
                                  placeholder="W"
                                  {...form.register("dimensions_width")}
                                  className="h-9 text-xs focus-visible:ring-primary flex-1"
                                />
                                <span className="text-xs text-muted-foreground">×</span>
                                <Input
                                  placeholder="H"
                                  {...form.register("dimensions_height")}
                                  className="h-9 text-xs focus-visible:ring-primary flex-1"
                                />
                                <Select
                                  value={form.watch("dimensions_unit") || "cm"}
                                  onValueChange={(v) => form.setValue("dimensions_unit", v)}
                                >
                                  <SelectTrigger className="h-9 text-xs focus-visible:ring-primary w-20">
                                    <SelectValue placeholder="cm" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cm" className="text-xs">cm</SelectItem>
                                    <SelectItem value="mm" className="text-xs">mm</SelectItem>
                                    <SelectItem value="m" className="text-xs">m</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          <Separator />

                          <Field
                            label="Warranty terms"
                            editing={isEditing}
                            view={<DescriptionView text={product.warranty_info} placeholder="Warranty specifications not provided." />}
                          >
                            <Textarea
                              {...form.register("warranty_info")}
                              rows={2}
                              className="text-sm resize-none focus-visible:ring-primary"
                            />
                          </Field>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Media library manager */}
              <TabsContent value="media" className="mt-4 md:mt-6 focus-visible:outline-none">
                <Card className="border border-border/80 shadow-sm rounded-2xl">
                  <CardHeader className="bg-muted/10 border-b p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-primary" />
                          Device Media Assets
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Manage clinical product display assets. Uploaded images are stored locally.
                        </CardDescription>
                      </div>
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 text-xs rounded-xl font-semibold border-border active:scale-[0.97] transition-all duration-150 self-start sm:self-auto"
                          asChild
                        >
                          <label
                            htmlFor="image-upload"
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Upload Asset
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={imageMutations.upload.isPending}
                            />
                          </label>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    {product.images && product.images.length > 0 ? (
                      <div className="flex flex-col gap-4 md:gap-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                          {product.images.map((image, index) => (
                            <div
                              key={image.id}
                              onClick={() => {
                                if (!isEditing || image.is_primary) return;
                                const currentIds = product.images.map(img => img.id);
                                const newOrder = [image.id, ...currentIds.filter(id => id !== image.id)];
                                imageMutations.reorder.mutate(newOrder);
                              }}
                              className={cn(
                                "relative aspect-square rounded-2xl overflow-hidden group border transition-all select-none bg-muted/20",
                                isEditing && !image.is_primary ? "cursor-pointer" : "",
                                image.is_primary ? "border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-950" : "border-border hover:border-primary/50"
                              )}
                            >
                              <img
                                src={image.url}
                                alt={image.alt_text || `Asset ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {image.is_primary ? (
                                <div className="absolute bottom-0 left-0 right-0 bg-primary text-[9px] font-bold text-white py-1 text-center uppercase tracking-wider">
                                  Primary
                                </div>
                              ) : (
                                isEditing && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] font-bold text-white py-1 text-center uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                    Set Primary
                                  </div>
                                )
                              )}
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    imageMutations.remove.mutate(image.id);
                                  }}
                                  disabled={imageMutations.remove.isPending || imageMutations.reorder.isPending}
                                  className="absolute top-2 right-2 h-7 w-7 bg-white/95 dark:bg-slate-900/95 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all border border-border hover:bg-destructive/10 hover:border-destructive/30"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </button>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <label className="aspect-square rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-all group">
                              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Add Image</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={imageMutations.upload.isPending}
                              />
                            </label>
                          )}
                        </div>

                        <div className="p-3 md:p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3 items-start">
                          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-amber-900 dark:text-amber-300">Clinical Image Standards</p>
                            <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-medium leading-relaxed mt-1">
                              Please upload high-resolution images: 1. Main perspective view, 2. Control console or screen interface, 3. Serial / rating plate label, 4. Included accessories.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center border-2 border-dashed rounded-2xl bg-muted/5 border-muted-foreground/10 p-4 md:p-6">
                        <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                          <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-bold tracking-tight text-foreground">No clinical images uploaded</p>
                        <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-6">
                          Clinical listings require images of the physical medical device or console interface.
                        </p>
                        {isEditing ? (
                          <label className="px-4 h-9 bg-primary text-primary-foreground text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-md hover:bg-primary/95 transition-all">
                            <Upload className="h-4 w-4" />
                            Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={imageMutations.upload.isPending}
                            />
                          </label>
                        ) : (
                          <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider bg-amber-500/5 px-2.5 py-1 rounded-full border border-amber-500/10">
                            Required to approve listings
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="mt-4 md:mt-6 focus-visible:outline-none">
                <Card className="border border-border/80 shadow-sm rounded-2xl">
                  <CardHeader className="bg-emerald-500/5 border-b p-4 md:p-5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600">
                      <Globe className="h-4 w-4" />
                      Search Engine Optimization
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Configure custom metatags for organic search indexing and visibility.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                    
                    {/* Meta Title */}
                    <div className="space-y-2">
                      <Field
                        label="Meta Title"
                        editing={isEditing}
                        view={
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                            {product.meta_title || product.name}
                          </p>
                        }
                      >
                        <Input
                          {...form.register("meta_title")}
                          className="h-10 text-sm focus-visible:ring-primary"
                        />
                      </Field>
                      {/* Character Count Progress */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Characters: {watchedMetaTitle.length} / 60</span>
                        <span className={cn(
                          "font-bold",
                          watchedMetaTitle.length >= 40 && watchedMetaTitle.length <= 60 ? "text-emerald-600" : "text-amber-500"
                        )}>
                          {watchedMetaTitle.length >= 40 && watchedMetaTitle.length <= 60 ? "Optimal Length" : "Non-optimal Length"}
                        </span>
                      </div>
                      <Progress
                        value={Math.min((watchedMetaTitle.length / 60) * 100, 100)}
                        className={cn(
                          "h-1 rounded-full",
                          watchedMetaTitle.length >= 40 && watchedMetaTitle.length <= 60 ? "[&>div]:bg-emerald-500" : "[&>div]:bg-amber-500"
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Meta Description */}
                    <div className="space-y-2">
                      <Field
                        label="Meta Description"
                        editing={isEditing}
                        view={
                          <DescriptionView
                            text={product.meta_description}
                            placeholder="System-generated description based on narrative."
                          />
                        }
                      >
                        <Textarea
                          {...form.register("meta_description")}
                          rows={3}
                          className="text-sm resize-none focus-visible:ring-primary"
                        />
                      </Field>
                      {/* Character Count Progress */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Characters: {watchedMetaDesc.length} / 160</span>
                        <span className={cn(
                          "font-bold",
                          watchedMetaDesc.length >= 110 && watchedMetaDesc.length <= 160 ? "text-emerald-600" : "text-amber-500"
                        )}>
                          {watchedMetaDesc.length >= 110 && watchedMetaDesc.length <= 160 ? "Optimal Length" : "Non-optimal Length"}
                        </span>
                      </div>
                      <Progress
                        value={Math.min((watchedMetaDesc.length / 160) * 100, 100)}
                        className={cn(
                          "h-1 rounded-full",
                          watchedMetaDesc.length >= 110 && watchedMetaDesc.length <= 160 ? "[&>div]:bg-emerald-500" : "[&>div]:bg-amber-500"
                        )}
                      />
                    </div>

                    <Separator />

                    <Field
                      label="Search Tags (Comma-Separated)"
                      editing={isEditing}
                      view={<TagsView tags={product.tags} />}
                    >
                      <Input
                        {...form.register("tags")}
                        placeholder="Surgical, Sterile, bp-monitor..."
                        className="h-10 text-sm focus-visible:ring-primary"
                      />
                    </Field>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right / Sidebar widgets */}
          <div className="lg:col-span-1 flex flex-col gap-4 md:gap-6 order-1 lg:order-2">

            {/* Mobile/Tablet Sidebar Toggle */}
            <div className="lg:hidden flex items-center justify-between p-3 bg-muted/40 border border-border/60 rounded-xl">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Status & Actions</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="h-8 px-3 text-xs"
              >
                {showSidebar ? "Hide" : "Show"}
              </Button>
            </div>

            {/* Lifecyle Governance Card */}
            <Card className={cn(
              "border border-border/80 shadow-sm rounded-2xl transition-all duration-200",
              !showSidebar && "lg:block hidden"
            )}>
              <CardHeader className="bg-muted/10 border-b p-4 md:p-5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Lifecycle &amp; Audit Status
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Governance lifecycle parameters and compliance review actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">

                {completeness && (
                  <div className="space-y-3 md:space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Completeness Score
                        </span>
                        <Badge
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full text-white",
                            completeness.is_ready_to_verify ? "bg-emerald-500" : "bg-amber-500"
                          )}
                        >
                          {completeness.score}%
                        </Badge>
                      </div>
                      <Progress
                        value={completeness.score}
                        className={cn(
                          "h-1.5 rounded-full",
                          completeness.is_ready_to_verify ? "[&>div]:bg-emerald-500" : "[&>div]:bg-amber-500"
                        )}
                      />
                    </div>

                    {/* Step-by-Step Completeness Audit Checklist */}
                    <div className="space-y-2 border bg-muted/10 rounded-2xl p-3 md:p-4">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">
                        <ListChecks className="h-3.5 w-3.5 text-primary" />
                        Audit Desk Checklist
                      </h5>
                      <ul className="space-y-2">
                        {checklistItems.map((item, idx) => (
                          <li key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground truncate flex-1 mr-2">{item.label}</span>
                            <Badge className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0",
                              item.isCompleted ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"
                            )}>
                              {item.isCompleted ? "VERIFIED" : "PENDING"}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {completeness.missing_required.length > 0 && (
                      <div className="space-y-1 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 md:p-3.5">
                        <p className="text-[9px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Action Required:
                        </p>
                        <ul className="space-y-1 mt-1.5">
                          {completeness.missing_required.map((field) => {
                            const item = completeness.items.find((i) => i.field === field);
                            return (
                              <li key={field} className="text-[10px] text-amber-700/90 dark:text-amber-400/90 flex items-center gap-1.5">
                                <span className="h-1 w-1 rounded-full bg-amber-500 flex-shrink-0" />
                                <span className="truncate">{item?.label || field}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-[10px] text-muted-foreground justify-center gap-1.5 hover:bg-muted active:scale-95 duration-100 rounded-lg"
                      onClick={handleAIClick}
                      disabled={!isEditing || aiGen.isPending}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      AI Autofill suggestions
                    </Button>
                  </div>
                )}

                <Separator />

                {/* Governance actions */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Listing Governance Actions
                  </span>
                  {!isEditing ? (
                    <div className="flex flex-col gap-2">
                      {product.status === "draft" && (
                        <Button
                          size="sm"
                          className="w-full h-9 text-xs rounded-xl font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow active:scale-[0.97] transition-all duration-150"
                          onClick={() => handleStatusAction("verify")}
                          disabled={isSaving}
                        >
                          Submit for Review
                        </Button>
                      )}
                      {product.status === "pending_review" && (
                        <>
                          <Button
                            size="sm"
                            className="w-full h-9.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-[0.97] transition-all duration-150 rounded-xl"
                            onClick={() => handleStatusAction("publish")}
                            disabled={isSaving}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve &amp; Publish
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-9 text-xs font-bold text-destructive border-destructive/20 hover:bg-destructive/5 active:scale-[0.97] transition-all duration-150 rounded-xl"
                            onClick={() => setShowRejectDialog(true)}
                            disabled={isSaving}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject with Feedback
                          </Button>

                          <div className="p-3 md:p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2.5">
                             <div className="flex items-center gap-2">
                               <Sparkles className="h-4 w-4 text-indigo-600" />
                               <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">Audit Desk Validator</span>
                             </div>
                             <p className="text-[10px] text-muted-foreground leading-relaxed">
                               Cross-reference listings against medical device taxonomy specifications.
                             </p>
                             <Button
                               variant="outline"
                               size="sm"
                               className="w-full h-8 text-[10px] font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 active:scale-[0.97] transition-all duration-150 rounded-lg"
                               onClick={() => aiValidate.mutate()}
                               disabled={isSaving}
                             >
                               {aiValidate.isPending ? (
                                 <>
                                   <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                   Validating...
                                 </>
                               ) : (
                                 "Run AI Validation"
                               )}
                             </Button>
                          </div>
                        </>
                      )}
                      {product.status === "published" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-9 text-xs rounded-xl font-bold border-border text-slate-700 hover:bg-muted active:scale-[0.97] transition-all duration-150"
                          onClick={() => handleStatusAction("archive")}
                          disabled={isSaving}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive Listing
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic bg-muted/20 border p-2.5 rounded-lg text-center">
                      Governance actions locked during edit mode
                    </p>
                  )}
                </div>

                <Separator />

                {/* Analytical Stats */}
                <div className="space-y-3 md:space-y-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Listing Analytics
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Listing Views</span>
                    <span className="font-bold text-foreground">
                      {product.view_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Platform Popularity Score
                    </span>
                    <span className="font-extrabold text-primary">
                      {product.popularity_score || 0}%
                    </span>
                  </div>
                </div>

                {vendorName && (
                  <>
                    <Separator />
                    <div className="rounded-2xl bg-slate-950 p-3 md:p-4 text-white relative overflow-hidden shadow-md">
                      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-16 h-16 bg-primary/20 rounded-full blur-xl" />
                      <div className="relative z-10 space-y-2">
                        <Package className="h-4 w-4 text-yellow-400" />
                        <p className="text-xs font-bold truncate">{vendorName}</p>
                        <p className="text-[9px] text-slate-400 leading-normal">
                          Vendor owns write access privileges. Updates are audited.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Destructive actions */}
                <div className="flex flex-col items-center text-center gap-2 p-3 md:p-4 rounded-2xl bg-destructive/5 border border-dashed border-destructive/10">
                  <div className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">
                    Destructive Action Desk
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full h-8 text-xs font-semibold rounded-xl"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isSaving}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Purge SKU Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[380px] max-w-[calc(100%-2rem)] rounded-2xl mx-4">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-3">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold">
              Purge SKU Data?
            </DialogTitle>
            <DialogDescription className="text-xs pt-1 leading-relaxed">
              This will permanently delete{" "}
              <span className="font-bold text-foreground">
                &ldquo;{product.name}&rdquo;
              </span>{" "}
              from the active active catalog indexing. This operation is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSaving}
              className="rounded-lg h-9 text-xs flex-1 sm:flex-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                mutations.delete.mutate(undefined, {
                  onSuccess: () => router.push("/dashboard/catalog/products"),
                });
              }}
              disabled={isSaving}
              className="rounded-lg h-9 text-xs flex-1 sm:flex-auto"
            >
              {mutations.delete.isPending && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              Yes, Purge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={() => setShowRejectDialog(false)}>
        <DialogContent className="sm:max-w-[480px] max-w-[calc(100%-2rem)] rounded-3xl mx-4">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold">Reject Listing Submission</DialogTitle>
            <DialogDescription className="text-xs pt-0.5 leading-relaxed">
              Provide clinical or administrative feedback for this product. Rejection resets status to draft.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection (e.g. incorrect certifications, clinical inaccuracies, bad images)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[120px] rounded-2xl p-4 text-xs border-muted-foreground/20 focus:ring-primary focus-visible:ring-primary focus-visible:outline-none"
            />
          </div>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="ghost"
              onClick={() => setShowRejectDialog(false)}
              className="font-bold text-xs uppercase tracking-widest flex-1 sm:flex-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectionReason.trim() || mutations.reject.isPending}
              className="rounded-xl px-6 font-bold text-xs uppercase tracking-wider flex-1 sm:flex-auto"
            >
              {mutations.reject.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Send Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
