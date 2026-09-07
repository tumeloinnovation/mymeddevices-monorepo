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
  Zap,
  Globe,
  Settings2,
  FileText,
  Clock,
  Archive,
  XCircle,
  Package,
  ArrowLeft,
  ArrowRight,
  Star,
  Tag,
  SlidersHorizontal,
  Search,
  Share2,
  Award,
  Store,
  DollarSign,
  TrendingUp,
  HouseIcon,
  PanelsTopLeftIcon,
  BoxIcon,
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  useProductCategories,
  useBrands,
  useProductMutations,
  useImageMutations,
  useAIGenerate,
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
  TagsView,
  DescriptionView,
  SlugView,
  SpecificationsView,
  SpecificationsEditor,
  MarkupTierVisualizer,
} from "./_components/product-form-fields";
import { RelatedProductsEditor } from "./_components/RelatedProductsEditor";

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; icon: any; color: string; bg: string; border: string; dot: string }
> = {
  draft: {
    label: "Draft",
    icon: FileText,
    color: "text-gray-700 dark:text-gray-300",
    bg: "bg-gray-100 dark:bg-gray-800/60",
    border: "border-gray-200 dark:border-gray-700",
    dot: "bg-gray-400",
  },
  pending_review: {
    label: "Pending Review",
    icon: Clock,
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  published: {
    label: "Published",
    icon: CheckCircle2,
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    color: "text-slate-700 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-900/60",
    border: "border-slate-200 dark:border-slate-800",
    dot: "bg-slate-400",
  },
};

function StatusBadge({ status }: { status: ProductStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <Badge
      variant="outline"
      className={cn(
        cfg.bg,
        cfg.color,
        cfg.border,
        "inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 text-[11px] rounded-full shadow-2xs"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label.toUpperCase()}
    </Badge>
  );
}

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().default(""),
  short_description: z.string().default(""),
  sku: z.string().default(""),
  category_id: z.string().default(""),
  brand: z.string().default(""),
  model_number: z.string().default(""),
  base_price: z.coerce.number().optional(),
  price: z.coerce.number().optional(),
  compare_at_price: z.coerce.number().optional(),
  stock_quantity: z.coerce.number().default(0),
  low_stock_threshold: z.coerce.number().default(5),
  track_inventory: z.boolean().default(true),
  specifications: z.string().default(""),
  meta_title: z.string().default(""),
  meta_description: z.string().default(""),
  tags: z.string().default(""),
  is_clinical_pick: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_on_sale: z.boolean().default(false),
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
    compare_at_price: (p as any).compare_at_price ?? undefined,
    stock_quantity: p.stock_quantity ?? 0,
    low_stock_threshold: p.low_stock_threshold ?? 5,
    track_inventory: p.track_inventory ?? true,
    specifications: JSON.stringify(p.specifications || {}, null, 2),
    meta_title: p.meta_title || "",
    meta_description: p.meta_description || "",
    tags: (p.tags || []).join(", "),
    is_clinical_pick: p.is_clinical_pick ?? false,
    is_featured: p.is_featured ?? false,
    is_on_sale: p.is_on_sale ?? false,
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
    compare_at_price: toOptionalNumber(values.compare_at_price),
    currency: "KES",
    stock_quantity: values.stock_quantity !== undefined ? Number(values.stock_quantity) : 0,
    low_stock_threshold: values.low_stock_threshold !== undefined ? Number(values.low_stock_threshold) : 5,
    track_inventory: values.track_inventory,
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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [newStatus, setNewStatus] = useState<ProductStatus | "">("");

  const { data: product, isLoading, error, refetch } = useProduct(productId);
  const { data: categories = [] } = useProductCategories();
  const { data: brands = [] } = useBrands();
  const { data: vendors = [] } = useVendorsOverview();
  const mutations = useProductMutations(productId);
  const imageMutations = useImageMutations(productId);
  const aiGen = useAIGenerate(productId);

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
    
    const catObj = (product as any).category;
    if (catObj && typeof catObj === "object" && catObj.name) {
      return catObj.name;
    }

    const activeCatId = form.watch("category_id") || product.category_id;
    if (activeCatId) {
      const match = categories.find((c) => c.id === activeCatId || c.name === activeCatId);
      if (match) return match.name;
    }

    if (product.category_name && !isUuid(product.category_name)) {
      return product.category_name;
    }

    return "General Medical Equipment";
  }, [product, categories, form]);

  useEffect(() => {
    if (product) form.reset(productToFormValues(product));
  }, [product, form]);

  // Keyboard shortcut listener: Cmd/Ctrl + S to save, Esc to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isEditing) handleSave();
      } else if (e.key === "Escape" && isEditing) {
        setIsEditing(false);
        if (product) form.reset(productToFormValues(product));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, product, form]);

  const handleSave = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid) return toast.error("Please fix form errors before saving.");

    const values = form.getValues();
    const payload = formValuesToPayload(values);

    if (payload.specifications === undefined && values.specifications) {
      return toast.error("Invalid JSON format in specifications.");
    }

    mutations.update.mutate(payload, {
      onSuccess: () => {
        setIsEditing(false);
        toast.success("Product changes saved successfully.");
      },
    });
  }, [form, mutations.update]);

  const handleToggleClinicalPick = useCallback((checked: boolean) => {
    form.setValue("is_clinical_pick", checked, { shouldDirty: true });
    if (!isEditing) {
      mutations.update.mutate({ is_clinical_pick: checked } as any, {
        onSuccess: () => toast.success(checked ? "Endorsed as Clinical Pick" : "Clinical Pick removed"),
        onError: (err: any) => toast.error("Failed to update: " + (err.message || "Unknown error")),
      });
    }
  }, [isEditing, form, mutations.update]);

  const handleToggleFeatured = useCallback((checked: boolean) => {
    form.setValue("is_featured", checked, { shouldDirty: true });
    if (!isEditing) {
      mutations.update.mutate({ is_featured: checked } as any, {
        onSuccess: () => toast.success(checked ? "Promoted to Featured Hero" : "Featured status removed"),
        onError: (err: any) => toast.error("Failed to update: " + (err.message || "Unknown error")),
      });
    }
  }, [isEditing, form, mutations.update]);

  const handleToggleOnSale = useCallback((checked: boolean) => {
    form.setValue("is_on_sale", checked, { shouldDirty: true });
    if (!isEditing) {
      mutations.update.mutate({ is_on_sale: checked } as any, {
        onSuccess: () => toast.success(checked ? "Sale pricing enabled" : "Sale pricing disabled"),
        onError: (err: any) => toast.error("Failed to update: " + (err.message || "Unknown error")),
      });
    }
  }, [isEditing, form, mutations.update]);

  const handleStatusAction = useCallback(
    (action: "verify" | "publish" | "archive") => {
      mutations[action].mutate();
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

  // AI is strictly used in SEO Meta Generation only
  const handleGenerateSEOMeta = useCallback(() => {
    aiGen.mutate(undefined, {
      onSuccess: (data) => {
        if (data.suggestions) {
          if (data.suggestions.meta_title) {
            form.setValue("meta_title", data.suggestions.meta_title, { shouldDirty: true });
          }
          if (data.suggestions.meta_description) {
            form.setValue("meta_description", data.suggestions.meta_description, { shouldDirty: true });
          }
          toast.success("AI generated SEO Title & Meta Description.");
        }
      },
    });
  }, [aiGen, form]);

  const handleApplyMarkupTierRate = useCallback((rate: number) => {
    const base = Number(form.getValues("base_price") || 0);
    if (!base || base <= 0) {
      toast.error("Please enter a valid Vendor Payout first.");
      return;
    }
    const calculatedRetail = Math.round(base * (1 + rate / 100));
    form.setValue("price", calculatedRetail, { shouldDirty: true });
    toast.success(`Applied +${rate}% markup (Retail: KES ${calculatedRetail.toLocaleString("en-KE")})`);
  }, [form]);

  const isSaving =
    mutations.update.isPending ||
    mutations.verify.isPending ||
    mutations.publish.isPending ||
    mutations.archive.isPending ||
    mutations.delete.isPending ||
    imageMutations.upload.isPending ||
    imageMutations.remove.isPending;

  const vendorName = product && findVendorName(product.vendor_id, vendors);

  const watchedPrice = form.watch("price") || product?.price || 0;
  const watchedBasePrice = form.watch("base_price") || product?.base_price || 0;
  const watchedMetaTitle = form.watch("meta_title") || "";
  const watchedMetaDesc = form.watch("meta_description") || "";

  const effectiveMarkupAmount = watchedPrice > watchedBasePrice ? watchedPrice - watchedBasePrice : 0;
  const effectiveMarkupPercent = watchedBasePrice > 0 ? (effectiveMarkupAmount / watchedBasePrice) * 100 : 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1400px] mx-auto">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !product) {
    const errorMsg = error instanceof Error ? error.message : "The requested product SKU could not be loaded.";
    const isAuthError =
      errorMsg.toLowerCase().includes("authenticated") ||
      errorMsg.toLowerCase().includes("credentials") ||
      errorMsg.toLowerCase().includes("token") ||
      errorMsg.toLowerCase().includes("unauthorized") ||
      (error as any)?.status === 401;

    return (
      <DashboardLayout>
        <div className="p-8 text-center space-y-4 max-w-md mx-auto mt-12 bg-card border border-border/80 rounded-2xl shadow-xs">
          <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">
              {isAuthError ? "Authentication Required" : "Product Could Not Be Loaded"}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAuthError
                ? "Your admin session is expired or not authenticated. Please log in to access catalog products."
                : errorMsg}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            {isAuthError ? (
              <Button onClick={() => router.push("/login")} size="sm" className="rounded-xl text-xs font-semibold">
                Go to Login
              </Button>
            ) : (
              <Button onClick={() => refetch()} variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
                Retry
              </Button>
            )}
            <Button onClick={() => router.push("/dashboard/catalog/products")} variant="ghost" size="sm" className="rounded-xl text-xs">
              Back to Catalog
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1400px] mx-auto pb-28">
        
        {/* Breadcrumbs Navigation Bar */}
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => router.push("/dashboard/catalog/products")}
            className="flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground transition-colors bg-muted/40 hover:bg-muted px-3 py-1.5 rounded-xl border border-border/60 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Products</span>
          </button>
          <div className="flex items-center gap-1.5 truncate text-[11px]">
            <span>Catalog</span>
            <span>/</span>
            <span>{categoryDisplayName}</span>
            <span>/</span>
            <span className="font-bold text-foreground truncate max-w-[200px] sm:max-w-[300px]">{product.name}</span>
          </div>
        </div>

        {/* Premium Header Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Left: Thumbnail & Title & Meta Badges */}
            <div className="flex items-start sm:items-center gap-3.5 md:gap-4 min-w-0 flex-1">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs group relative">
                {primaryImage ? (
                  <img
                    src={primaryImage.url}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <Package className="h-7 w-7 text-muted-foreground/40" />
                )}
              </div>
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-foreground truncate">
                    {product.name}
                  </h1>
                  <StatusBadge status={product.status} />
                </div>
                <div className="flex items-center gap-2.5 flex-wrap text-xs text-muted-foreground">
                  <MonoView className="text-[11px]">{product.sku || "NO-SKU"}</MonoView>
                  {brandDisplayName && (
                    <span className="flex items-center gap-1 font-medium bg-muted/40 px-2 py-0.5 rounded-md border border-border/50">
                      <Store className="h-3 w-3 text-muted-foreground" />
                      <strong className="text-foreground">{brandDisplayName}</strong>
                    </span>
                  )}
                  {vendorName && (
                    <span className="hidden sm:inline-flex items-center gap-1 font-medium bg-muted/40 px-2 py-0.5 rounded-md border border-border/50">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                      <span>{vendorName}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Action Buttons Toolbar */}
            <div className="flex items-center gap-2 flex-wrap justify-start lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs rounded-xl font-bold border-border/80 hover:bg-muted"
                asChild
              >
                <a
                  href={`${process.env.NEXT_PUBLIC_CUSTOMER_URL || "http://localhost:3000"}/products/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  Storefront ↗
                </a>
              </Button>

              {!isEditing ? (
                <>
                  {product.status === "draft" && (
                    <Button
                      size="sm"
                      className="h-9 text-xs rounded-xl font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-xs"
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
                        className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs rounded-xl"
                        onClick={() => handleStatusAction("publish")}
                        disabled={isSaving}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Approve &amp; Publish
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs font-bold text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl"
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
                    className="h-9 text-xs rounded-xl font-bold bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-2xs"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                    Edit Product
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs rounded-xl font-semibold text-muted-foreground hover:text-foreground"
                    onClick={() => setShowStatusChangeDialog(true)}
                    disabled={isSaving}
                  >
                    <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                    Status
                  </Button>

                  {product.status === "draft" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs rounded-xl font-bold text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs rounded-xl font-bold border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                      onClick={() => handleStatusAction("archive")}
                      disabled={isSaving || product.status === "archived"}
                    >
                      <Archive className="mr-1.5 h-3.5 w-3.5" />
                      {product.status === "archived" ? "Archived" : "Archive"}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs rounded-xl font-semibold border-border/80"
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
                    className="h-9 text-xs rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
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

          {/* Neutral Quick Metrics Bar Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-border/60 text-xs">
            <div className="bg-muted/20 p-2.5 rounded-xl border border-border/50">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Retail Price
              </span>
              <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                KES {(watchedPrice || 0).toLocaleString("en-KE")}
              </span>
            </div>

            <div className="bg-muted/20 p-2.5 rounded-xl border border-border/50">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Vendor Base Payout
              </span>
              <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                KES {(watchedBasePrice || 0).toLocaleString("en-KE")}
              </span>
            </div>

            <div className="bg-muted/20 p-2.5 rounded-xl border border-border/50">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Platform Markup
              </span>
              <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                +KES {effectiveMarkupAmount.toLocaleString("en-KE")} ({effectiveMarkupPercent.toFixed(1)}%)
              </span>
            </div>

            <div className="bg-muted/20 p-2.5 rounded-xl border border-border/50">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Inventory Stock
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn(
                  "h-2 w-2 rounded-full",
                  product.stock_quantity === 0 ? "bg-red-500" :
                  product.stock_quantity <= (product.low_stock_threshold || 5) ? "bg-amber-500" : "bg-emerald-500"
                )} />
                <span className="text-sm font-extrabold text-foreground">
                  {product.stock_quantity.toLocaleString("en-KE")} Units
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Floating Pill Bar Tabs */}
        <div className="w-full space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-start overflow-x-auto py-1 -mx-1 px-1">
              <TabsList className="inline-flex h-auto items-center p-1.5 rounded-2xl bg-muted/70 dark:bg-muted/30 border border-border/80 shadow-2xs gap-1.5 w-auto">
                <TabsTrigger
                  value="details"
                  className="group inline-flex items-center gap-3.5 px-5.5 py-3 rounded-xl text-xs sm:text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-background/40 data-[state=active]:bg-card dark:data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border"
                >
                  <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-transparent group-data-[state=active]:bg-primary/10 transition-colors">
                    <HouseIcon
                      aria-hidden="true"
                      className="size-4 shrink-0 opacity-70 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary transition-all duration-200 group-hover:scale-105"
                    />
                  </span>
                  <span>Overview &amp; Specs</span>
                </TabsTrigger>

                <TabsTrigger
                  value="pricing"
                  className="group inline-flex items-center gap-3.5 px-5.5 py-3 rounded-xl text-xs sm:text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-background/40 data-[state=active]:bg-card dark:data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border"
                >
                  <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-transparent group-data-[state=active]:bg-primary/10 transition-colors">
                    <PanelsTopLeftIcon
                      aria-hidden="true"
                      className="size-4 shrink-0 opacity-70 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary transition-all duration-200 group-hover:scale-105"
                    />
                  </span>
                  <span>Pricing &amp; Stock</span>
                </TabsTrigger>

                <TabsTrigger
                  value="media"
                  className="group inline-flex items-center gap-3.5 px-5.5 py-3 rounded-xl text-xs sm:text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-background/40 data-[state=active]:bg-card dark:data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border"
                >
                  <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-transparent group-data-[state=active]:bg-primary/10 transition-colors">
                    <BoxIcon
                      aria-hidden="true"
                      className="size-4 shrink-0 opacity-70 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary transition-all duration-200 group-hover:scale-105"
                    />
                  </span>
                  <span>Media Gallery</span>
                  {product.images && product.images.length > 0 && (
                    <Badge
                      className="bg-muted text-muted-foreground border border-border/50 ms-1.5 px-2 py-0.5 h-5 text-[10px] font-bold rounded-full group-data-[state=active]:border-primary/30 group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary transition-colors"
                      variant="secondary"
                    >
                      {product.images.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="relations"
                  className="group inline-flex items-center gap-3.5 px-5.5 py-3 rounded-xl text-xs sm:text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-background/40 data-[state=active]:bg-card dark:data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border"
                >
                  <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-transparent group-data-[state=active]:bg-primary/10 transition-colors">
                    <Share2
                      aria-hidden="true"
                      className="size-4 shrink-0 opacity-70 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary transition-all duration-200 group-hover:scale-105"
                    />
                  </span>
                  <span>Relations &amp; Upsells</span>
                </TabsTrigger>

                <TabsTrigger
                  value="seo"
                  className="group inline-flex items-center gap-3.5 px-5.5 py-3 rounded-xl text-xs sm:text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-background/40 data-[state=active]:bg-card dark:data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border"
                >
                  <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-transparent group-data-[state=active]:bg-primary/10 transition-colors">
                    <Globe
                      aria-hidden="true"
                      className="size-4 shrink-0 opacity-70 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary transition-all duration-200 group-hover:scale-105"
                    />
                  </span>
                  <span>SEO &amp; Discovery</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: DETAILS & SPECS */}
            <TabsContent value="details" className="mt-8 flex flex-col gap-6 focus-visible:outline-none">
              <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/60 p-4 sm:p-5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Product Identity &amp; Classification
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Device nomenclature, catalog category, manufacturer brand, and identification codes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                  {/* Identity Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Field
                      label="Product Name"
                      editing={isEditing}
                      view={<TextView>{product.name}</TextView>}
                    >
                      <Input {...form.register("name")} className="h-9.5 text-sm focus-visible:ring-primary rounded-xl bg-background" />
                    </Field>

                    <Field
                      label="Storefront URL Slug"
                      editing={isEditing}
                      view={<SlugView slug={product.slug} />}
                    >
                      <Input {...form.register("slug")} className="h-9.5 text-xs font-mono focus-visible:ring-primary rounded-xl bg-background" />
                    </Field>

                    <Field
                      label="Catalog Category"
                      editing={isEditing}
                      view={<BadgeView>{categoryDisplayName}</BadgeView>}
                    >
                      <Select
                        value={form.watch("category_id")}
                        onValueChange={(v) => form.setValue("category_id", v, { shouldDirty: true })}
                      >
                        <SelectTrigger className="h-9.5 text-xs focus-visible:ring-primary rounded-xl bg-background">
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
                      view={<BrandView name={brandDisplayName} />}
                    >
                      <Input {...form.register("brand")} className="h-9.5 text-sm focus-visible:ring-primary rounded-xl bg-background" />
                    </Field>

                    <Field
                      label="Model Number"
                      editing={isEditing}
                      view={<TextView>{product.model_number}</TextView>}
                    >
                      <Input {...form.register("model_number")} className="h-9.5 text-sm focus-visible:ring-primary rounded-xl bg-background" />
                    </Field>

                    <Field
                      label="Stock Keeping Unit (SKU)"
                      editing={isEditing}
                      view={<MonoView>{product.sku || "N/A"}</MonoView>}
                    >
                      <Input {...form.register("sku")} className="h-9.5 text-xs font-mono focus-visible:ring-primary rounded-xl bg-background" />
                    </Field>
                  </div>

                  <Separator className="border-border/60" />

                  {/* Descriptions */}
                  <div className="space-y-5">
                    <Field
                      label="Short Tagline (Marketplace Summary)"
                      editing={isEditing}
                      view={<DescriptionView text={product.short_description} placeholder="No short tagline defined." />}
                    >
                      <Textarea
                        {...form.register("short_description")}
                        rows={2}
                        placeholder="A concise summary for search results, category cards, and quick previews."
                        className="text-sm resize-none focus-visible:ring-primary rounded-xl bg-background"
                      />
                    </Field>

                    <Field
                      label="Detailed Clinical / Technical Description"
                      editing={isEditing}
                      view={<DescriptionView text={product.description} placeholder="No detailed clinical narrative defined." />}
                    >
                      <Textarea
                        {...form.register("description")}
                        rows={5}
                        placeholder="Comprehensive product specifications, clinical indications, diagnostic workflows, and package contents..."
                        className="text-sm resize-none focus-visible:ring-primary rounded-xl bg-background"
                      />
                    </Field>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Specifications Card */}
              <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/60 p-4 sm:p-5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    Technical Specifications &amp; Parameters
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Structured key-value metrics (e.g. Power, Resolution, Frequencies, Dimensions, Accuracy).
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <Field
                    label="Product Attributes"
                    editing={isEditing}
                    view={<SpecificationsView data={product.specifications || {}} />}
                  >
                    <SpecificationsEditor form={form} />
                  </Field>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: PRICING & STOCK */}
            <TabsContent value="pricing" className="mt-8 flex flex-col gap-6 focus-visible:outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Pricing & Tiered Markup */}
                <div className="lg:col-span-7 space-y-6">
                  <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b border-border/60 p-4 sm:p-5">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Commercial Pricing &amp; Tiered Markup
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Vendor payout benchmark, tiered markup recommendation, and customer retail price.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                          label="Vendor Base Payout (KES)"
                          editing={isEditing}
                          view={<PriceView value={product.base_price} currency={product.currency} />}
                        >
                          <Input
                            type="number"
                            {...form.register("base_price")}
                            className="h-9.5 text-sm focus-visible:ring-primary rounded-xl bg-background"
                            placeholder="Vendor payout amount"
                          />
                        </Field>

                        <Field
                          label="Customer Retail Price (KES)"
                          editing={isEditing}
                          view={<PriceView value={product.price} currency={product.currency} />}
                        >
                          <Input
                            type="number"
                            {...form.register("price")}
                            className="h-9.5 text-sm focus-visible:ring-primary rounded-xl bg-background"
                            placeholder="Storefront selling price"
                          />
                        </Field>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                          label="Compare-At Original Price (KES)"
                          editing={isEditing}
                          view={<ComparePriceView value={product.compare_at_price} currency={product.currency} />}
                          hint="Optional strike-through price"
                        >
                          <Input
                            type="number"
                            {...form.register("compare_at_price")}
                            className="h-9.5 text-sm focus-visible:ring-primary rounded-xl bg-background"
                            placeholder="Slash-through original price"
                          />
                        </Field>
                      </div>

                      {/* Tiered Markup Engine Visualizer (Neutral Styled) */}
                      <MarkupTierVisualizer
                        vendorPayout={watchedBasePrice}
                        retailPrice={watchedPrice}
                        isEditing={isEditing}
                        onApplyRate={handleApplyMarkupTierRate}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Inventory & Merchandising */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Merchandising Badges */}
                  <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b border-border/60 p-4 sm:p-5">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        Storefront Merchandising Badges
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between p-3.5 border border-border/70 rounded-xl bg-card hover:bg-muted/20 transition-colors">
                        <div className="space-y-0.5">
                          <label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                            Clinical Pick Endorsement
                          </label>
                          <p className="text-[11px] text-muted-foreground">
                            Highlight product with Clinical Pick badge.
                          </p>
                        </div>
                        <Switch
                          checked={form.watch("is_clinical_pick") ?? product.is_clinical_pick}
                          onCheckedChange={handleToggleClinicalPick}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 border border-border/70 rounded-xl bg-card hover:bg-muted/20 transition-colors">
                        <div className="space-y-0.5">
                          <label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 text-muted-foreground" />
                            Featured Hero Placement
                          </label>
                          <p className="text-[11px] text-muted-foreground">
                            Promote item on storefront home hero carousel.
                          </p>
                        </div>
                        <Switch
                          checked={form.watch("is_featured") ?? product.is_featured}
                          onCheckedChange={handleToggleFeatured}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 border border-border/70 rounded-xl bg-card hover:bg-muted/20 transition-colors">
                        <div className="space-y-0.5">
                          <label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                            Promotional Sale Pricing
                          </label>
                          <p className="text-[11px] text-muted-foreground">
                            Mark as active promotional sale on storefront.
                          </p>
                        </div>
                        <Switch
                          checked={form.watch("is_on_sale") ?? product.is_on_sale}
                          onCheckedChange={handleToggleOnSale}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stock Tracking */}
                  <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b border-border/60 p-4 sm:p-5">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        Inventory &amp; Stock Tracking
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Field
                          label="Current Stock Count"
                          editing={isEditing}
                          view={<StockView quantity={product.stock_quantity} />}
                        >
                          <Input type="number" {...form.register("stock_quantity")} className="h-9.5 text-sm focus-visible:ring-primary rounded-xl bg-background" />
                        </Field>
                        <Field
                          label="Low Stock Alert Threshold"
                          editing={isEditing}
                          view={<p className="text-sm font-bold text-foreground mt-1">{product.low_stock_threshold ?? 5} Units</p>}
                        >
                          <Input type="number" {...form.register("low_stock_threshold")} className="h-9.5 text-sm focus-visible:ring-primary rounded-xl bg-background" />
                        </Field>
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-muted/20 rounded-xl border border-dashed border-border/80">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground">Track Inventory Depletion</Label>
                          <p className="text-[10px] text-muted-foreground">Alert when orders deplete stock below threshold</p>
                        </div>
                        <Switch
                          checked={form.watch("track_inventory")}
                          onCheckedChange={(checked) => form.setValue("track_inventory", checked)}
                          disabled={!isEditing}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </TabsContent>

            {/* TAB 3: MEDIA */}
            <TabsContent value="media" className="mt-8 focus-visible:outline-none">
              <Card className="border border-border/80 shadow-sm rounded-2xl bg-card overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/60 p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        Product Media Assets
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Upload high-resolution clinical images. Click an image in edit mode to set it as Primary.
                      </CardDescription>
                    </div>
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs rounded-xl font-bold border-border/80"
                        asChild
                      >
                        <label htmlFor="media-upload" className="cursor-pointer flex items-center gap-2">
                          <Upload className="h-3.5 w-3.5" />
                          Upload Asset
                          <input
                            id="media-upload"
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                            "relative aspect-square rounded-2xl overflow-hidden group border transition-all select-none bg-muted/20 shadow-2xs",
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
                            <div className="absolute bottom-0 left-0 right-0 bg-primary text-[10px] font-bold text-white py-1 text-center uppercase tracking-wider shadow-xs">
                              Primary Image
                            </div>
                          ) : (
                            isEditing && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] font-bold text-white py-1 text-center uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
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
                              disabled={imageMutations.remove.isPending}
                              className="absolute top-2.5 right-2.5 h-7.5 w-7.5 bg-white/95 dark:bg-slate-900/95 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all border border-border hover:bg-destructive/10 hover:border-destructive/30 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <label className="aspect-square rounded-2xl border-2 border-dashed border-border/70 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-all group shadow-2xs">
                          <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center group-hover:scale-110 transition-transform">
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
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-2xl bg-muted/5 border-border/70 p-6">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-bold text-foreground">No media assets uploaded</p>
                      <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4">
                        Upload high-resolution photos of the physical medical device or console interface.
                      </p>
                      {isEditing && (
                        <label className="px-4 h-9 bg-primary text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs hover:bg-primary/95 transition-all">
                          <Upload className="h-4 w-4" />
                          Upload First Image
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: RELATIONS & UPSELLS */}
            <TabsContent value="relations" className="mt-8 flex flex-col gap-6 focus-visible:outline-none">
              <RelatedProductsEditor productId={product.id} initialProductType={(product as any).product_type || 'simple'} />
            </TabsContent>

            {/* TAB 5: SEO & DISCOVERY */}
            <TabsContent value="seo" className="mt-8 flex flex-col gap-6 focus-visible:outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: SEO Form Inputs */}
                <div className="lg:col-span-7 space-y-6">
                  <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b border-border/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary" />
                            Search Engine Optimization (SEO) Metadata
                          </CardTitle>
                          <CardDescription className="text-xs text-muted-foreground">
                            Configure Google metadata and search keywords.
                          </CardDescription>
                        </div>
                        {isEditing && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateSEOMeta}
                            disabled={aiGen.isPending}
                            className="h-8.5 rounded-xl text-xs font-bold gap-1.5 border-border/80 text-foreground hover:bg-muted"
                          >
                            {aiGen.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5 text-primary" />
                            )}
                            ✨ Generate with AI
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-5">
                      {/* Meta Title */}
                      <div className="space-y-2">
                        <Field
                          label="SEO Title Tag"
                          editing={isEditing}
                          view={<p className="text-sm font-semibold text-foreground py-1">{product.meta_title || `${product.name} | MyMedDevices Kenya`}</p>}
                        >
                          <Input
                            {...form.register("meta_title")}
                            placeholder={`${product.name} | MyMedDevices Kenya`}
                            className="h-9.5 text-sm focus-visible:ring-primary rounded-xl bg-background"
                          />
                        </Field>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Character count: <strong className="text-foreground">{watchedMetaTitle.length}</strong> / 60</span>
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md",
                            watchedMetaTitle.length >= 35 && watchedMetaTitle.length <= 60
                              ? "bg-muted text-foreground border-border"
                              : watchedMetaTitle.length > 60
                              ? "bg-muted text-muted-foreground border-border"
                              : "bg-muted text-muted-foreground border-border"
                          )}>
                            {watchedMetaTitle.length >= 35 && watchedMetaTitle.length <= 60
                              ? "Optimal Title"
                              : watchedMetaTitle.length > 60
                              ? "Too Long"
                              : "Short Title"}
                          </Badge>
                        </div>
                        <Progress
                          value={Math.min((watchedMetaTitle.length / 60) * 100, 100)}
                          className="h-1 rounded-full"
                        />
                      </div>

                      <Separator className="border-border/60" />

                      {/* Meta Description */}
                      <div className="space-y-2">
                        <Field
                          label="SEO Meta Description"
                          editing={isEditing}
                          view={<DescriptionView text={product.meta_description} placeholder="Auto-generated search snippet description." />}
                        >
                          <Textarea
                            {...form.register("meta_description")}
                            rows={3}
                            placeholder="Buy certified medical equipment in Kenya. Direct vendor sourcing, best prices, fast delivery..."
                            className="text-sm resize-none focus-visible:ring-primary rounded-xl bg-background"
                          />
                        </Field>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Character count: <strong className="text-foreground">{watchedMetaDesc.length}</strong> / 160</span>
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md",
                            watchedMetaDesc.length >= 110 && watchedMetaDesc.length <= 160
                              ? "bg-muted text-foreground border-border"
                              : watchedMetaDesc.length > 160
                              ? "bg-muted text-muted-foreground border-border"
                              : "bg-muted text-muted-foreground border-border"
                          )}>
                            {watchedMetaDesc.length >= 110 && watchedMetaDesc.length <= 160
                              ? "Optimal Length"
                              : watchedMetaDesc.length > 160
                              ? "Too Long"
                              : "Short Description"}
                          </Badge>
                        </div>
                        <Progress
                          value={Math.min((watchedMetaDesc.length / 160) * 100, 100)}
                          className="h-1 rounded-full"
                        />
                      </div>

                      <Separator className="border-border/60" />

                      {/* Search Tags */}
                      <div className="space-y-2">
                        <Field
                          label="Search Keywords &amp; Tags (Comma-Separated)"
                          editing={isEditing}
                          view={<TagsView tags={product.tags} />}
                        >
                          <Input
                            {...form.register("tags")}
                            placeholder="ultrasound, cardiology, medical equipment..."
                            className="h-9.5 text-sm focus-visible:ring-primary rounded-xl bg-background"
                          />
                        </Field>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Live SERP Simulator */}
                <div className="lg:col-span-5 space-y-6">
                  <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b border-border/60 p-4 sm:p-5">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <Search className="h-4 w-4 text-primary" />
                        Live Google Search Result Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 bg-white dark:bg-slate-950 font-sans space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="h-6 w-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-extrabold text-[10px] shrink-0">
                          M
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12px] font-medium text-slate-800 dark:text-slate-200 leading-tight">MyMedDevices Kenya</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            https://mymeddevices.co.ke › products › {product.slug || "product-slug"}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base text-[#1a0dab] dark:text-[#8ab4f8] font-normal hover:underline leading-snug line-clamp-1">
                        {watchedMetaTitle || `${product.name} — Buy Online in Kenya | MyMedDevices`}
                      </h3>

                      <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
                        {watchedMetaDesc || product.short_description || product.description || "Certified medical equipment procurement in Kenya. Direct vendor sourcing, best prices."}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          KES {(watchedPrice || 0).toLocaleString("en-KE")}
                        </span>
                        <span>•</span>
                        <span>{product.stock_quantity > 0 ? "In stock" : "Out of stock"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Floating Bottom Save Bar when Editing */}
        {isEditing && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background/95 backdrop-blur-md border border-border px-5 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center gap-2 pr-3 border-r border-border">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-semibold text-foreground">Editing Mode</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                form.reset(productToFormValues(product));
              }}
              disabled={isSaving}
              className="h-8.5 rounded-xl text-xs font-medium"
            >
              Discard (Esc)
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm"
            >
              {isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
              Save Changes <kbd className="ml-1.5 text-[10px] opacity-75 font-mono">⌘S</kbd>
            </Button>
          </div>
        )}

      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[380px] max-w-[calc(100%-2rem)] rounded-2xl mx-4">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-3">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold">Purge Product?</DialogTitle>
            <DialogDescription className="text-xs pt-1 leading-relaxed">
              This will permanently delete <span className="font-bold text-foreground">&ldquo;{product.name}&rdquo;</span> from the catalog.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSaving}
              className="rounded-lg h-9 text-xs"
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
              className="rounded-lg h-9 text-xs"
            >
              {mutations.delete.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Yes, Purge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={() => setShowRejectDialog(false)}>
        <DialogContent className="sm:max-w-[480px] max-w-[calc(100%-2rem)] rounded-3xl mx-4">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-muted text-foreground flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-lg font-bold">Reject Listing</DialogTitle>
            <DialogDescription className="text-xs pt-0.5 leading-relaxed">
              Provide feedback for the vendor. Rejection resets status to draft.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[120px] rounded-2xl p-4 text-xs"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowRejectDialog(false)}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectionReason.trim() || mutations.reject.isPending}
              className="rounded-xl px-6 text-xs font-bold"
            >
              {mutations.reject.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Send Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusChangeDialog} onOpenChange={() => setShowStatusChangeDialog(false)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-muted text-foreground flex items-center justify-center mb-2">
              <Activity className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold">Change Lifecycle Status</DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-3">
            {[
              { value: "draft", label: "Draft", desc: "In development / editing state", icon: FileText },
              { value: "pending_review", label: "Pending Review", desc: "Submitted for review", icon: Clock },
              { value: "published", label: "Published", desc: "Visible to storefront customers", icon: CheckCircle2 },
              { value: "archived", label: "Archived", desc: "Hidden from customer storefront", icon: Archive },
            ].map((status) => {
              const Icon = status.icon;
              const isCurrent = product.status === status.value;
              const isSelected = newStatus === status.value;

              return (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setNewStatus(status.value as ProductStatus)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl text-left border transition-all text-xs w-full cursor-pointer",
                    isCurrent
                      ? "bg-muted/60 border-border cursor-default opacity-80"
                      : isSelected
                      ? "bg-primary/10 border-primary ring-1 ring-primary"
                      : "bg-card hover:bg-muted/50 border-border"
                  )}
                >
                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between font-bold">
                      <span>{status.label}</span>
                      {isCurrent && <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-semibold">CURRENT</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{status.desc}</p>
                  </div>
                </button>
              );
            })}
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
              {mutations.changeStatus.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Apply Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
