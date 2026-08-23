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
  Percent,
  DollarSign,
  Ruler,
  Scale,
  ListChecks,
  Award,
  Star,
  Tag,
  SlidersHorizontal,
  Search,
  Share2,
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
  useBrands,
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
import { RelatedProductsEditor } from "./_components/RelatedProductsEditor";

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
  base_price: z.coerce.number().optional(),
  price: z.coerce.number().optional(),
  cost_price: z.coerce.number().optional(),
  sale_price: z.coerce.number().optional(),
  wholesale_price: z.coerce.number().optional(),
  compare_at_price: z.coerce.number().optional(),
  markup_price: z.coerce.number().optional(),
  commission_fee: z.coerce.number().optional(),
  stock_quantity: z.coerce.number().default(0),
  low_stock_threshold: z.coerce.number().default(5),
  track_inventory: z.boolean().default(true),
  weight_kg: z.coerce.number().optional(),
  dimensions_length: z.string().default(""),
  dimensions_width: z.string().default(""),
  dimensions_height: z.string().default(""),
  dimensions_unit: z.string().default("cm"),
  specifications: z.string().default(""),
  meta_title: z.string().default(""),
  meta_description: z.string().default(""),
  tags: z.string().default(""),
  certifications: z.string().default(""),
  is_clinical_pick: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_on_sale: z.boolean().default(false),
  has_vat: z.boolean().default(true),
  vat_rate: z.coerce.number().default(16),
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
    base_price: p.base_price ?? undefined,
    price: p.price ?? undefined,
    cost_price: (p as any).cost_price ?? undefined,
    sale_price: (p as any).sale_price ?? undefined,
    wholesale_price: p.wholesale_price ?? undefined,
    compare_at_price: (p as any).compare_at_price ?? undefined,
    markup_price: p.markup_price ?? undefined,
    commission_fee: p.commission_fee ?? undefined,
    stock_quantity: p.stock_quantity ?? 0,
    low_stock_threshold: p.low_stock_threshold ?? 5,
    track_inventory: p.track_inventory ?? true,
    weight_kg: p.weight_kg ?? undefined,
    dimensions_length: p.dimensions?.length?.toString() || "",
    dimensions_width: p.dimensions?.width?.toString() || "",
    dimensions_height: p.dimensions?.height?.toString() || "",
    dimensions_unit: p.dimensions?.unit || "cm",
    specifications: JSON.stringify(p.specifications || {}, null, 2),
    meta_title: p.meta_title || "",
    meta_description: p.meta_description || "",
    tags: (p.tags || []).join(", "),
    certifications: (p.certifications || []).join(", "),
    is_clinical_pick: p.is_clinical_pick ?? false,
    is_featured: p.is_featured ?? false,
    is_on_sale: p.is_on_sale ?? false,
    has_vat: (p as any).has_vat ?? true,
    vat_rate: (p as any).vat_rate ?? 16,
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
    base_price: toOptionalNumber(values.base_price),
    price: toOptionalNumber(values.price),
    cost_price: toOptionalNumber(values.cost_price),
    wholesale_price: toOptionalNumber(values.wholesale_price),
    compare_at_price: toOptionalNumber(values.compare_at_price),
    markup_price: toOptionalNumber(values.markup_price),
    commission_fee: toOptionalNumber(values.commission_fee),
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
    meta_title: values.meta_title || undefined,
    meta_description: values.meta_description || undefined,
    tags: values.tags
      ? values.tags.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    is_clinical_pick: values.is_clinical_pick,
    is_featured: values.is_featured,
    is_on_sale: values.is_on_sale,
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
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [newStatus, setNewStatus] = useState<ProductStatus | "">("");
  const [activeGalleryImageIndex, setActiveGalleryImageIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);

  const { data: product, isLoading, error } = useProduct(productId);
  const { data: completeness } = useProductCompleteness(productId);
  const { data: categories = [] } = useProductCategories();
  const { data: brands = [] } = useBrands();
  const { data: vendors = [] } = useVendorsOverview();
  const mutations = useProductMutations(productId);

  const brandDisplayName = useMemo(() => {
    if (!product?.brand) return undefined;
    const match = brands.find((b) => b.id === product.brand || b.name === product.brand);
    return match?.name || product.brand;
  }, [product?.brand, brands]);

  const form = useForm<ProductFormValues>({
    resolver: standardSchemaResolver(productSchema) as any,
    defaultValues: productToFormValues(product ?? ({} as Product)),
  });

  const categoryDisplayName = useMemo(() => {
    if (!product) return "Uncategorized";
    const isUuid = (val?: string) => val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    
    // Check if category object is present on product
    const catObj = (product as any).category;
    if (catObj && typeof catObj === "object" && catObj.name) {
      return catObj.name;
    }

    // Match by category_id from loaded categories
    const activeCatId = form.watch("category_id") || product.category_id;
    if (activeCatId) {
      const match = categories.find((c) => c.id === activeCatId || c.name === activeCatId);
      if (match) return match.name;
    }

    // Match by category_name if valid string and not UUID
    if (product.category_name && !isUuid(product.category_name)) {
      return product.category_name;
    }

    return "General Medical Equipment";
  }, [product, categories, form]);

  const imageMutations = useImageMutations(productId);
  const aiGen = useAIGenerate(productId);
  const aiValidate = useAIValidate(productId);

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

  const handleToggleClinicalPick = useCallback((checked: boolean) => {
    form.setValue("is_clinical_pick", checked, { shouldDirty: true });
    if (!isEditing) {
      mutations.update.mutate({ is_clinical_pick: checked } as any, {
        onSuccess: () => toast.success(checked ? "Product endorsed as Clinical Pick" : "Clinical Pick endorsement removed"),
        onError: (err: any) => toast.error("Failed to update endorsement: " + (err.message || "Unknown error")),
      });
    }
  }, [isEditing, form, mutations.update]);

  const handleToggleFeatured = useCallback((checked: boolean) => {
    form.setValue("is_featured", checked, { shouldDirty: true });
    if (!isEditing) {
      mutations.update.mutate({ is_featured: checked } as any, {
        onSuccess: () => toast.success(checked ? "Product promoted to Featured Hero" : "Featured Hero placement removed"),
        onError: (err: any) => toast.error("Failed to update hero placement: " + (err.message || "Unknown error")),
      });
    }
  }, [isEditing, form, mutations.update]);

  const handleToggleOnSale = useCallback((checked: boolean) => {
    form.setValue("is_on_sale", checked, { shouldDirty: true });
    if (!isEditing) {
      mutations.update.mutate({ is_on_sale: checked } as any, {
        onSuccess: () => toast.success(checked ? "Promotional sale pricing enabled" : "Promotional sale pricing disabled"),
        onError: (err: any) => toast.error("Failed to update sale status: " + (err.message || "Unknown error")),
      });
    }
  }, [isEditing, form, mutations.update]);

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

  const handleStatusChangeSubmit = useCallback(() => {
    if (!newStatus) return;
    mutations.changeStatus.mutate(
      { id: productId, status: newStatus },
      {
        onSuccess: () => {
          setShowStatusChangeDialog(false);
          setNewStatus("");
          toast.success(`Product status changed to ${newStatus}`);
        },
      }
    );
  }, [productId, newStatus, mutations.changeStatus]);

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
  const watchedWholesalePrice = form.watch("wholesale_price") || 0;
  const watchedBasePrice = form.watch("base_price") || 0;

  const markupAmount = watchedPrice > watchedWholesalePrice ? watchedPrice - watchedWholesalePrice : 0;
  const markupPercent = watchedWholesalePrice > 0 ? (markupAmount / watchedWholesalePrice) * 100 : 0;

  const vendorMarginAmount = watchedWholesalePrice > watchedBasePrice ? watchedWholesalePrice - watchedBasePrice : 0;
  const vendorMarginPercent = watchedWholesalePrice > 0 ? (vendorMarginAmount / watchedWholesalePrice) * 100 : 0;

  const totalMarkupAmount = watchedPrice > watchedBasePrice ? watchedPrice - watchedBasePrice : 0;
  const totalMarkupPercent = watchedBasePrice > 0 ? (totalMarkupAmount / watchedBasePrice) * 100 : 0;

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
        <div className="bg-card border border-border/80 rounded-2xl p-4 md:p-5 shadow-xs space-y-3">
          {/* Row 1: Product Image & Title */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-muted/40 border border-border flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
              {primaryImage ? (
                <img
                  src={primaryImage.url}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <Package className="h-6 w-6 text-muted-foreground/30" />
              )}
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground truncate">
                {product.name}
              </h1>
              {product.short_description && (
                <p className="text-xs text-muted-foreground truncate max-w-3xl">{product.short_description}</p>
              )}
            </div>
          </div>

          <Separator className="border-border/60" />

          {/* Row 2: Status, SKU & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
            {/* Status & SKU */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <StatusBadge status={product.status} />
              <div className="flex items-center gap-2 text-muted-foreground">
                <MonoView className="truncate">{product.sku || "NO-SKU"}</MonoView>
                {vendorName && (
                  <span className="flex items-center gap-1 font-medium truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span className="truncate">{vendorName}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8.5 text-xs rounded-xl font-semibold border-border hover:bg-muted active:scale-[0.97] transition-all duration-150"
                    asChild
                  >
                    <a
                      href={`${process.env.NEXT_PUBLIC_CUSTOMER_URL || "http://localhost:3000"}/products/${product.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                      Preview
                    </a>
                  </Button>

                  {product.status === "draft" && (
                    <Button
                      size="sm"
                      className="h-8.5 text-xs rounded-xl font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm active:scale-[0.97] transition-all duration-150"
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
                        className="h-8.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-[0.97] transition-all duration-150 rounded-xl"
                        onClick={() => handleStatusAction("publish")}
                        disabled={isSaving}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Approve &amp; Publish
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 hover:bg-amber-50 active:scale-[0.97] transition-all duration-150 rounded-xl"
                        onClick={() => setShowRejectDialog(true)}
                        disabled={isSaving}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8.5 text-xs rounded-xl font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-xs active:scale-[0.97] transition-all duration-150"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                    Edit Product
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8.5 text-xs rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.97] transition-all duration-150"
                    onClick={() => setShowStatusChangeDialog(true)}
                    disabled={isSaving}
                  >
                    <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                    Change Status
                  </Button>

                  {product.status === "draft" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8.5 text-xs rounded-xl font-semibold text-destructive border-destructive/20 hover:bg-destructive/10 active:scale-[0.97] transition-all duration-150"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8.5 text-xs rounded-xl font-semibold border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 active:scale-[0.97] transition-all duration-150"
                      onClick={() => handleStatusAction("archive")}
                      disabled={isSaving || product.status === "archived"}
                    >
                      <Archive className="mr-1.5 h-3.5 w-3.5" />
                      {product.status === "archived" ? "Archived" : "Archive Product"}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8.5 text-xs rounded-xl font-semibold border-border active:scale-[0.97] transition-all duration-150"
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
                    className="h-8.5 text-xs rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-[0.97] transition-all duration-150"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Save Changes
                  </Button>
                </>
              )}
            </div>
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

        {/* Full-width Single Column Layout */}
        <div className="w-full space-y-6">
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
                <TabsTrigger
                  value="relations"
                  className="px-3 md:px-4 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-[11px] md:text-xs font-semibold tracking-wide transition-all duration-150 whitespace-nowrap"
                >
                  Relations
                </TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="mt-6 flex flex-col gap-6 focus-visible:outline-none">
                {/* Structured Essential Info Card */}
                <Card className="border border-border/80 shadow-xs rounded-2xl">
                  <CardHeader className="bg-muted/10 border-b p-4 sm:p-5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Essential Product Information
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Device nomenclature, categorization, brand details, and descriptions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-6">
                    {/* Identity Group */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Product Identity &amp; Classification</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field
                          label="Product Name"
                          editing={isEditing}
                          view={<TextView>{product.name}</TextView>}
                        >
                          <Input {...form.register("name")} className="h-9 text-sm focus-visible:ring-primary" />
                        </Field>
                        <Field
                          label="Storefront URL Slug"
                          editing={isEditing}
                          view={<SlugView slug={product.slug} />}
                        >
                          <Input {...form.register("slug")} className="h-9 text-xs font-mono focus-visible:ring-primary" />
                        </Field>
                        <Field
                          label="Catalog Category"
                          editing={isEditing}
                          view={<BadgeView>{categoryDisplayName}</BadgeView>}
                        >
                          <Select value={form.watch("category_id")} onValueChange={(v) => form.setValue("category_id", v, { shouldDirty: true })}>
                            <SelectTrigger className="h-9 text-xs focus-visible:ring-primary">
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
                      </div>
                    </div>

                    <Separator className="border-border/60" />

                    {/* Manufacturer & Compliance Group */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Manufacturer &amp; Regulatory Standards</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field
                          label="Brand (Manufacturer)"
                          editing={isEditing}
                          view={<BrandView name={brandDisplayName} />}
                        >
                          <Input {...form.register("brand")} className="h-9 text-sm focus-visible:ring-primary" />
                        </Field>
                        <Field
                          label="Model Number"
                          editing={isEditing}
                          view={<TextView>{product.model_number}</TextView>}
                        >
                          <Input {...form.register("model_number")} className="h-9 text-sm focus-visible:ring-primary" />
                        </Field>
                        <Field
                          label="Regulatory Clearances"
                          editing={isEditing}
                          view={<CertificationsView certs={product.certifications} />}
                        >
                          <Input
                            {...form.register("certifications")}
                            placeholder="ISO 13485, CE 0123, FDA Class II..."
                            className="h-9 text-sm focus-visible:ring-primary"
                          />
                        </Field>
                      </div>
                    </div>

                    <Separator className="border-border/60" />

                    {/* Narrative & Marketing Copy Group */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Marketplace Copy &amp; Clinical Description</h4>
                      <div className="space-y-4">
                        <Field
                          label="Short Tagline (Brief Overview)"
                          editing={isEditing}
                          view={<DescriptionView text={product.short_description} placeholder="No short tagline defined." />}
                        >
                          <Textarea
                            {...form.register("short_description")}
                            rows={2}
                            placeholder="A concise summary for search results and cards."
                            className="text-sm resize-none focus-visible:ring-primary"
                          />
                        </Field>
                        <Field
                          label="Complete Clinical Description"
                          editing={isEditing}
                          view={<DescriptionView text={product.description} placeholder="Full clinical narrative not yet defined." />}
                        >
                          <Textarea
                            {...form.register("description")}
                            rows={5}
                            placeholder="Comprehensive clinical overview, usage protocols, and technical features..."
                            className="text-sm resize-none focus-visible:ring-primary"
                          />
                        </Field>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pricing & Stock Tab */}
              <TabsContent value="pricing" className="mt-4 md:mt-6 flex flex-col gap-6 focus-visible:outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                  {/* Left Side: Pricing Breakdown & Margins */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Pricing Architecture Card */}
                    <Card className="border border-border/80 shadow-xs rounded-2xl">
                      <CardHeader className="bg-primary/5 border-b p-4 sm:p-5">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                          <ShoppingCart className="h-4 w-4" />
                          Pricing Architecture &amp; Payouts
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Retail prices, promotional sales, wholesale benchmarks, and vendor payouts.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 space-y-5">
                        {/* Retail & Sale Price Group */}
                        <div className="space-y-3">
                          <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Storefront Pricing</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field
                              label="Retail Customer Price (KES)"
                              editing={isEditing}
                              view={<PriceView value={product.price ?? (product as any)?.base_price} currency={product.currency} />}
                            >
                              <Input type="number" {...form.register("price")} className="h-9 text-sm focus-visible:ring-primary" />
                            </Field>
                            <Field
                              label="Compare-At Original Price (KES)"
                              editing={isEditing}
                              view={<ComparePriceView value={product.compare_at_price ?? ((product as any).compare_at_price || null)} currency={product.currency} />}
                            >
                              <Input
                                type="number"
                                {...form.register("compare_at_price")}
                                className="h-9 text-sm focus-visible:ring-primary"
                                placeholder="Optional slash-through price"
                              />
                            </Field>
                          </div>
                        </div>

                        <Separator className="border-border/60" />

                        {/* Wholesale & Vendor Payout Group */}
                        <div className="space-y-3">
                          <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">B2B Wholesale &amp; Vendor Earnings</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field
                              label="Vendor Base Payout (What Vendor Receives)"
                              editing={isEditing}
                              view={
                                <PriceView
                                  value={product.base_price ?? (product.price ? product.price / 1.07 : null)}
                                  currency={product.currency}
                                />
                              }
                            >
                              <Input type="number" {...form.register("base_price")} className="h-9 text-sm focus-visible:ring-primary" />
                            </Field>

                            <Field
                              label="Wholesale Benchmark Price (B2B Bulk Rate)"
                              editing={isEditing}
                              view={<PriceView value={product.wholesale_price ?? product.base_price} currency={product.currency} />}
                            >
                              <Input type="number" {...form.register("wholesale_price")} className="h-9 text-sm focus-visible:ring-primary" />
                            </Field>
                          </div>
                        </div>

                        <Separator className="border-border/60" />

                        {/* Tax / VAT Settings Group */}
                        <div className="space-y-3">
                          <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tax &amp; VAT Configuration</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                            <Field
                              label="VAT Tax Status"
                              editing={isEditing}
                              view={
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Badge variant="outline" className={(product as any)?.has_vat !== false ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-muted text-muted-foreground"}>
                                    {(product as any)?.has_vat !== false ? `Subject to VAT (${(product as any)?.vat_rate || 16}%)` : "VAT Exempt"}
                                  </Badge>
                                </div>
                              }
                            >
                              <div className="flex items-center gap-3 h-9">
                                <Switch
                                  checked={form.watch("has_vat") ?? (product as any)?.has_vat ?? true}
                                  onCheckedChange={(checked) => form.setValue("has_vat", checked, { shouldDirty: true })}
                                />
                                <span className="text-xs font-semibold text-foreground">
                                  {form.watch("has_vat") ? "VAT Applicable" : "VAT Exempt"}
                                </span>
                              </div>
                            </Field>

                            <Field
                              label="VAT Rate (%)"
                              editing={isEditing}
                              view={<p className="text-sm font-bold text-foreground mt-1">{(product as any)?.vat_rate || 16}%</p>}
                            >
                              <Input
                                type="number"
                                {...form.register("vat_rate")}
                                defaultValue={16}
                                className="h-9 text-sm focus-visible:ring-primary"
                                placeholder="16"
                              />
                            </Field>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Margin Analysis Panel */}
                    <Card className="border border-border/80 shadow-xs rounded-2xl bg-muted/10">
                      <CardHeader className="p-4 sm:p-5 border-b bg-card rounded-t-2xl">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                          <Percent className="h-4 w-4 text-primary" />
                          Platform Commission &amp; Profit Margin Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-5 space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Retail Price (Effective)</span>
                          <span className="font-bold text-foreground">
                            KES {(form.watch("price") || product.price || 0).toLocaleString("en-KE")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Vendor Base Payout (Net)</span>
                          <span className="font-bold text-foreground">
                            KES {(form.watch("base_price") || product.base_price || 0).toLocaleString("en-KE")}
                          </span>
                        </div>
                        <Separator className="border-dashed" />
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-foreground">Estimated Marketplace Margin &amp; Commission</span>
                          <div className="text-right">
                            <span className="text-emerald-600 font-extrabold">
                              KES {((form.watch("price") || product.price || 0) - (form.watch("base_price") || product.base_price || 0)).toLocaleString("en-KE")}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Side: Merchandising & Inventory Controls */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Merchandising & Clinical Pick Badges */}
                    <Card className="border border-border/80 shadow-xs rounded-2xl">
                      <CardHeader className="bg-emerald-500/5 border-b p-4 sm:p-5">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                          <Award className="h-4 w-4" />
                          Merchandising Controls
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Clinical endorsement badges and hero highlights.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-xl bg-card hover:bg-muted/30 transition-colors">
                          <div className="space-y-0.5">
                            <label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Clinical Pick Endorsement
                            </label>
                            <p className="text-[11px] text-muted-foreground">
                              Flag product as verified by clinical compliance board.
                            </p>
                          </div>
                          <Switch
                            checked={form.watch("is_clinical_pick") ?? product.is_clinical_pick}
                            onCheckedChange={handleToggleClinicalPick}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-xl bg-card hover:bg-muted/30 transition-colors">
                          <div className="space-y-0.5">
                            <label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                              <Star className="h-3.5 w-3.5 text-amber-500" />
                              Featured Hero Placement
                            </label>
                            <p className="text-[11px] text-muted-foreground">
                              Promote item on main storefront hero carousel.
                            </p>
                          </div>
                          <Switch
                            checked={form.watch("is_featured") ?? product.is_featured}
                            onCheckedChange={handleToggleFeatured}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-xl bg-card hover:bg-muted/30 transition-colors">
                          <div className="space-y-0.5">
                            <label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                              <Tag className="h-3.5 w-3.5 text-rose-500" />
                              Promotional Sale Pricing
                            </label>
                            <p className="text-[11px] text-muted-foreground">
                              Mark as active promotional item on storefront.
                            </p>
                          </div>
                          <Switch
                            checked={form.watch("is_on_sale") ?? product.is_on_sale}
                            onCheckedChange={handleToggleOnSale}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Inventory & Stock Card */}
                    <Card className="border border-border/80 shadow-xs rounded-2xl">
                      <CardHeader className="bg-amber-500/5 border-b p-4 sm:p-5">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600">
                          <Zap className="h-4 w-4" />
                          Inventory &amp; Stock Tracking
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Monitor storage quantities and low-stock alert thresholds.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Field
                            label="Stock Count"
                            editing={isEditing}
                            view={<StockView quantity={product.stock_quantity} />}
                          >
                            <Input type="number" {...form.register("stock_quantity")} className="h-9 text-sm focus-visible:ring-primary" />
                          </Field>
                          <Field
                            label="Low Stock Alert Threshold"
                            editing={isEditing}
                            view={<p className="text-sm font-bold text-foreground mt-1">{product.low_stock_threshold ?? 5} Units</p>}
                          >
                            <Input type="number" {...form.register("low_stock_threshold")} className="h-9 text-sm focus-visible:ring-primary" />
                          </Field>
                        </div>

                        <Separator className="border-border/60" />

                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-dashed border-border/80">
                          <div className="space-y-0.5">
                            <Label className="text-xs font-bold text-foreground">Track Inventory</Label>
                            <p className="text-[10px] text-muted-foreground">Enable stock depletion warnings</p>
                          </div>
                          <Switch
                            checked={form.watch("track_inventory")}
                            onCheckedChange={(checked) => form.setValue("track_inventory", checked)}
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="p-3.5 rounded-xl bg-muted/40 border flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Stock Status:</span>
                          <Badge className={cn(
                            "rounded-md font-bold px-2 py-0.5 text-[10px]",
                            product.stock_quantity === 0 ? "bg-red-500/10 text-red-700 border-red-200" :
                            product.stock_quantity <= (product.low_stock_threshold || 5) ? "bg-amber-500/10 text-amber-700 border-amber-200" :
                            "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                          )}>
                            {product.stock_quantity === 0 ? "OUT OF STOCK" :
                             product.stock_quantity <= (product.low_stock_threshold || 5) ? "LOW STOCK ALERT" :
                             "IN STOCK"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                </div>
              </TabsContent>

              {/* Technical Specifications Tab */}
              <TabsContent value="technical" className="mt-4 md:mt-6 flex flex-col gap-4 md:gap-6 focus-visible:outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                  {/* Main Specs Editor / View */}
                  <Card className="border border-border/80 shadow-sm rounded-2xl lg:col-span-8">
                    <CardHeader className="bg-indigo-500/5 border-b p-4 sm:p-5">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <Settings2 className="h-4 w-4" />
                        Clinical &amp; Technical Configuration Specifications
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Structured technical metrics, diagnostic parameters, and physical device dimensions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <Field
                        label="Technical Specifications Schema"
                        editing={isEditing}
                        view={<SpecificationsView data={product.specifications || {}} />}
                      >
                        <SpecificationsEditor form={form} />
                      </Field>
                    </CardContent>
                  </Card>

                  {/* Right Side Clinical Standards Info */}
                  <Card className="border border-border/80 shadow-sm rounded-2xl lg:col-span-4 flex flex-col justify-between">
                    <div>
                      <CardHeader className="bg-muted/10 border-b p-4 sm:p-5">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <SlidersHorizontal className="h-4 w-4 text-primary" />
                          Specification Guidelines
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Recommendations for accurate medical device procurement listings.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-5 space-y-3.5 text-xs text-muted-foreground">
                        <div className="flex items-start gap-2 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                          <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-foreground block">Clinical Accuracy</span>
                            Ensure measurement ranges, accuracy tolerances, and power requirements match manufacturer certificates.
                          </div>
                        </div>

                        <div className="flex items-start gap-2 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-foreground block">Customer Filtering</span>
                            Specifications power customer comparisons and specialized filter criteria across hospital categories.
                          </div>
                        </div>
                      </CardContent>
                    </div>
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

              {/* SEO & Search Visibility Tab */}
              <TabsContent value="seo" className="mt-4 md:mt-6 focus-visible:outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                  {/* Left Column: Metatag Form Inputs */}
                  <div className="lg:col-span-7 space-y-6">
                    <Card className="border border-border/80 shadow-xs rounded-2xl">
                      <CardHeader className="bg-emerald-500/5 border-b p-4 sm:p-5">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                          <Globe className="h-4 w-4" />
                          Search Engine Optimization (SEO) Metadata
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Optimize product title, description, and tags for Google indexing and search ranking.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 space-y-5">
                        
                        {/* Meta Title Field */}
                        <div className="space-y-2">
                          <Field
                            label="SEO Title Tag"
                            editing={isEditing}
                            view={
                              <p className="text-sm font-semibold text-foreground">
                                {product.meta_title || `${product.name} | MyMedDevices Kenya`}
                              </p>
                            }
                          >
                            <Input
                              {...form.register("meta_title")}
                              placeholder={`${product.name} | MyMedDevices Kenya`}
                              className="h-9 text-sm focus-visible:ring-primary"
                            />
                          </Field>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Character count: <strong className="text-foreground">{watchedMetaTitle.length}</strong> / 60</span>
                            <Badge variant="outline" className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md",
                              watchedMetaTitle.length >= 35 && watchedMetaTitle.length <= 60
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : watchedMetaTitle.length > 60
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            )}>
                              {watchedMetaTitle.length >= 35 && watchedMetaTitle.length <= 60
                                ? "Optimal Title"
                                : watchedMetaTitle.length > 60
                                ? "Too Long (Will Truncate)"
                                : "Short Title"}
                            </Badge>
                          </div>
                          <Progress
                            value={Math.min((watchedMetaTitle.length / 60) * 100, 100)}
                            className={cn(
                              "h-1 rounded-full",
                              watchedMetaTitle.length >= 35 && watchedMetaTitle.length <= 60
                                ? "[&>div]:bg-emerald-500"
                                : watchedMetaTitle.length > 60
                                ? "[&>div]:bg-red-500"
                                : "[&>div]:bg-amber-500"
                            )}
                          />
                        </div>

                        <Separator className="border-border/60" />

                        {/* Meta Description Field */}
                        <div className="space-y-2">
                          <Field
                            label="SEO Meta Description"
                            editing={isEditing}
                            view={
                              <DescriptionView
                                text={product.meta_description}
                                placeholder="Auto-generated search snippet description."
                              />
                            }
                          >
                            <Textarea
                              {...form.register("meta_description")}
                              rows={3}
                              placeholder="Buy certified medical equipment in Kenya. Fast delivery, KMPDB compliant, best prices..."
                              className="text-sm resize-none focus-visible:ring-primary"
                            />
                          </Field>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Character count: <strong className="text-foreground">{watchedMetaDesc.length}</strong> / 160</span>
                            <Badge variant="outline" className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md",
                              watchedMetaDesc.length >= 110 && watchedMetaDesc.length <= 160
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : watchedMetaDesc.length > 160
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            )}>
                              {watchedMetaDesc.length >= 110 && watchedMetaDesc.length <= 160
                                ? "Optimal Length"
                                : watchedMetaDesc.length > 160
                                ? "Too Long (Will Truncate)"
                                : "Short Description"}
                            </Badge>
                          </div>
                          <Progress
                            value={Math.min((watchedMetaDesc.length / 160) * 100, 100)}
                            className={cn(
                              "h-1 rounded-full",
                              watchedMetaDesc.length >= 110 && watchedMetaDesc.length <= 160
                                ? "[&>div]:bg-emerald-500"
                                : watchedMetaDesc.length > 160
                                ? "[&>div]:bg-red-500"
                                : "[&>div]:bg-amber-500"
                            )}
                          />
                        </div>

                        <Separator className="border-border/60" />

                        {/* Search Tags Field */}
                        <div className="space-y-2">
                          <Field
                            label="Search Keywords &amp; Tags (Comma-Separated)"
                            editing={isEditing}
                            view={<TagsView tags={product.tags} />}
                          >
                            <Input
                              {...form.register("tags")}
                              placeholder="surgical, hospital equipment, KMPDB, stethoscope..."
                              className="h-9 text-sm focus-visible:ring-primary"
                            />
                          </Field>
                          <p className="text-[11px] text-muted-foreground">
                            Keywords improve internal storefront search indexing and Typesense relevance filters.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: Live Google & Social Preview Cards */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Live Google SERP Snippet Preview */}
                    <Card className="border border-border/80 shadow-xs rounded-2xl overflow-hidden">
                      <CardHeader className="bg-muted/20 border-b p-4 sm:p-5">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                          <Search className="h-4 w-4 text-emerald-600" />
                          Live Google Search Result Preview
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Real-time preview of how this product will render on Google Search results.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-5 bg-white dark:bg-slate-950 font-sans space-y-2">
                        {/* Site Identifier Row */}
                        <div className="flex items-center gap-2 text-xs">
                          <div className="h-6 w-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-extrabold text-[10px] shrink-0">
                            M
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-medium text-slate-800 dark:text-slate-200 leading-tight">MyMedDevices Kenya</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              https://mymeddevices.co.ke › products › {product.slug || "product-slug"}
                            </span>
                          </div>
                        </div>

                        {/* Title Link */}
                        <h3 className="text-base sm:text-lg text-[#1a0dab] dark:text-[#8ab4f8] font-normal hover:underline cursor-pointer leading-snug line-clamp-1">
                          {watchedMetaTitle || `${product.name} — Buy Online in Kenya | MyMedDevices`}
                        </h3>

                        {/* Snippet Description */}
                        <p className="text-xs sm:text-[13px] text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
                          {watchedMetaDesc || product.short_description || product.description || "Certified medical equipment procurement in Kenya. Direct vendor sourcing, KMPDB approved, fast delivery."}
                        </p>

                        {/* Product Rich Snippet Extra Row */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-2">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            KES {(product.price || 0).toLocaleString("en-KE")}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {product.stock_quantity > 0 ? "In stock" : "Out of stock"}
                          </span>
                          {brandDisplayName && (
                            <>
                              <span>•</span>
                              <span>Brand: {brandDisplayName}</span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Social Media Card Preview (OpenGraph) */}
                    <Card className="border border-border/80 shadow-xs rounded-2xl overflow-hidden">
                      <CardHeader className="bg-muted/20 border-b p-4 sm:p-5">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                          <Share2 className="h-4 w-4 text-primary" />
                          Social Media Card Preview (OpenGraph / WhatsApp / X)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-5">
                        <div className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-xs space-y-0">
                          <div className="h-36 bg-muted/30 relative flex items-center justify-center overflow-hidden border-b border-border/60">
                            {primaryImage ? (
                              <img src={primaryImage.url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="h-8 w-8 text-muted-foreground/40" />
                            )}
                            <Badge className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold border-none">
                              mymeddevices.co.ke
                            </Badge>
                          </div>
                          <div className="p-3 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-primary tracking-wider block">
                              MYMEDDEVICES.CO.KE
                            </span>
                            <h4 className="text-xs font-bold text-foreground line-clamp-1">
                              {watchedMetaTitle || product.name}
                            </h4>
                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                              {watchedMetaDesc || product.short_description || "Certified medical equipment marketplace in Kenya."}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                </div>
              </TabsContent>

              {/* Relations Tab */}
              <TabsContent value="relations" className="mt-4 md:mt-6 focus-visible:outline-none">
                <RelatedProductsEditor productId={product.id} initialProductType={(product as any).product_type || 'simple'} />
              </TabsContent>
            </Tabs>
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
              from the catalog. Only draft products can be deleted. This operation is irreversible.
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
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                if (mutations.delete.isPending) return;
                setShowDeleteDialog(false);
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

      {/* Status Change Dialog */}
      <Dialog open={showStatusChangeDialog} onOpenChange={() => setShowStatusChangeDialog(false)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Activity className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold">Lifecycle State Transition</DialogTitle>
            <DialogDescription className="text-xs pt-1 leading-relaxed">
              Transition <span className="font-bold text-foreground">{product?.name}</span> through defined approval lifecycle states.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-4">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Current Status:</span>
              <StatusBadge status={product?.status || "draft"} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">Allowed Next Status</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    value: "draft",
                    label: "Draft",
                    desc: "In development / editing state",
                    icon: FileText,
                    allowed: product?.status !== "draft",
                  },
                  {
                    value: "pending_review",
                    label: "Pending Review",
                    desc: "Submitted for compliance verification",
                    icon: Clock,
                    allowed: product?.status === "draft" || product?.status === "archived",
                  },
                  {
                    value: "published",
                    label: "Published",
                    desc: "Approved and visible to storefront customers",
                    icon: CheckCircle2,
                    allowed: product?.status === "pending_review" || product?.status === "draft" || product?.status === "archived",
                  },
                  {
                    value: "archived",
                    label: "Archived",
                    desc: "Hidden from customer storefront",
                    icon: Archive,
                    allowed: product?.status === "published" || product?.status === "pending_review",
                  },
                ].map((status) => {
                  const Icon = status.icon;
                  const isCurrent = product?.status === status.value;
                  const isSelected = newStatus === status.value;
                  const isDisabled = !status.allowed || isCurrent;

                  return (
                    <button
                      key={status.value}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setNewStatus(status.value as ProductStatus)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl text-left border transition-all text-xs",
                        isCurrent
                          ? "bg-muted/60 border-border cursor-default opacity-75"
                          : isSelected
                          ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary"
                          : isDisabled
                          ? "bg-muted/20 border-border/40 text-muted-foreground cursor-not-allowed opacity-50"
                          : "bg-card hover:bg-muted/50 border-border text-foreground cursor-pointer"
                      )}
                    >
                      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between font-bold">
                          <span>{status.label}</span>
                          {isCurrent && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-semibold">
                              CURRENT
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{status.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatusChangeDialog(false)}
              disabled={mutations.changeStatus.isPending}
              className="h-9 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleStatusChangeSubmit}
              disabled={!newStatus || newStatus === product?.status || mutations.changeStatus.isPending}
              className="h-9 text-xs rounded-xl font-bold bg-primary hover:bg-primary/95 text-primary-foreground"
            >
              {mutations.changeStatus.isPending && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              Apply Transition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
