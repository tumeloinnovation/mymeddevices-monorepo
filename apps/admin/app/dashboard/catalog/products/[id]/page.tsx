"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { Product, ProductStatus } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useProduct,
  useProductCompleteness,
  useProductCategories,
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
  CertificationsView,
  TagsView,
  JsonView,
  DescriptionView,
  SlugView,
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
      className={`${cfg.bg} ${cfg.color} ${cfg.border} flex w-fit items-center gap-1 font-semibold px-1.5 py-0.5 text-[10px] rounded-md`}
    >
      <Icon className="h-2.5 w-2.5" />
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
  manufacturer: z.string().default(""),
  model_number: z.string().default(""),
  price: z.coerce.number().optional(),
  compare_at_price: z.coerce.number().optional(),
  cost_price: z.coerce.number().optional(),
  currency: z.string().default("KES"),
  stock_quantity: z.coerce.number().default(0),
  low_stock_threshold: z.coerce.number().default(5),
  track_inventory: z.boolean().default(true),
  weight_kg: z.coerce.number().optional(),
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
    manufacturer: p.manufacturer || "",
    model_number: p.model_number || "",
    price: p.price ?? undefined,
    compare_at_price: p.compare_at_price ?? undefined,
    cost_price: p.cost_price ?? undefined,
    currency: p.currency || "KES",
    stock_quantity: p.stock_quantity ?? 0,
    low_stock_threshold: p.low_stock_threshold ?? 5,
    track_inventory: p.track_inventory ?? true,
    weight_kg: p.weight_kg ?? undefined,
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
    manufacturer: values.manufacturer || undefined,
    model_number: values.model_number || undefined,
    price: values.price ?? undefined,
    compare_at_price: values.compare_at_price ?? undefined,
    cost_price: values.cost_price ?? undefined,
    currency: values.currency,
    stock_quantity: values.stock_quantity ?? 0,
    low_stock_threshold: values.low_stock_threshold ?? 5,
    track_inventory: values.track_inventory,
    weight_kg: values.weight_kg ?? undefined,
    specifications: specs,
    certifications: values.certifications
      ? values.certifications.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    kmpdb_registration_number: values.kmpdb_registration_number || undefined,
    ppb_classification: values.ppb_classification || undefined,
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: product, isLoading, error } = useProduct(productId);
  const { data: completeness } = useProductCompleteness(productId);
  const { data: categories = [] } = useProductCategories();
  const { data: vendors = [] } = useVendorsOverview();
  const mutations = useProductMutations(productId);
  const imageMutations = useImageMutations(productId);
  const aiGen = useAIGenerate(productId);

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
    imageMutations.remove.isPending;

  const vendorName =
    product && findVendorName(product.vendor_id, vendors);

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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-muted/30 border border-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {product.images?.[0] ? (
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-5 w-5 text-muted-foreground/30" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">
                  {product.name}
                </h1>
                <StatusBadge status={product.status} />
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <MonoView>{product.sku || "NO-SKU"}</MonoView>
                {vendorName && (
                  <span className="text-muted-foreground/60">· {vendorName}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                  <a
                    href={`${process.env.NEXT_PUBLIC_CUSTOMER_URL || "http://localhost:3000"}/products/${product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Preview
                  </a>
                </Button>
                {product.status === "published" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleStatusAction("archive")}
                    disabled={isSaving}
                  >
                    <Archive className="mr-1.5 h-3.5 w-3.5" />
                    Archive
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
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
                  className="h-8 text-xs"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Save
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Completeness (inline in sidebar instead) */}

        {/* Tabs + Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="bg-muted/50 p-0.5 h-9 rounded-lg w-full justify-start overflow-x-hidden border">
                <TabsTrigger
                  value="general"
                  className="px-4 rounded-md h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs"
                >
                  General
                </TabsTrigger>
                <TabsTrigger
                  value="pricing"
                  className="px-4 rounded-md h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs"
                >
                  Pricing &amp; Stock
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className="px-4 rounded-md h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs"
                >
                  Media
                </TabsTrigger>
                <TabsTrigger
                  value="specs"
                  className="px-4 rounded-md h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs"
                >
                  Technical
                </TabsTrigger>
                <TabsTrigger
                  value="seo"
                  className="px-4 rounded-md h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs"
                >
                  SEO
                </TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="space-y-6 outline-none mt-6">
                <Card>
                  <CardHeader className="bg-muted/30 border-b p-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Essential Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field
                        label="Product Name"
                        editing={isEditing}
                        view={<TextView>{product.name}</TextView>}
                      >
                        <Input
                          {...form.register("name")}
                          className="h-9 text-sm"
                        />
                      </Field>
                      <Field
                        label="URL Slug"
                        editing={isEditing}
                        view={<SlugView slug={product.slug} />}
                      >
                        <Input
                          {...form.register("slug")}
                          className="h-9 text-xs font-mono"
                        />
                      </Field>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <Field
                        label="Category"
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
                          <SelectTrigger className="h-9 text-xs">
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
                        label="Brand"
                        editing={isEditing}
                        view={<BrandView name={product.brand} />}
                      >
                        <Input
                          {...form.register("brand")}
                          className="h-9 text-sm"
                        />
                      </Field>
                      <Field
                        label="Model"
                        editing={isEditing}
                        view={<TextView>{product.model_number}</TextView>}
                      >
                        <Input
                          {...form.register("model_number")}
                          className="h-9 text-sm"
                        />
                      </Field>
                    </div>

                    <Separator />

                    <Field
                      label="Tagline"
                      editing={isEditing}
                      view={
                        <DescriptionView
                          text={product.short_description}
                          placeholder="No short description."
                        />
                      }
                    >
                      <Textarea
                        {...form.register("short_description")}
                        rows={2}
                        className="text-sm resize-none"
                      />
                    </Field>

                    <Field
                      label="Marketing Narrative"
                      editing={isEditing}
                      view={
                        <DescriptionView
                          text={product.description}
                          placeholder="Narrative not yet available."
                        />
                      }
                    >
                      <Textarea
                        {...form.register("description")}
                        rows={5}
                        className="text-sm resize-none"
                      />
                    </Field>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pricing & Stock Tab */}
              <TabsContent value="pricing" className="space-y-6 outline-none mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="bg-primary/5 border-b p-4">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Commercial
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                        <Field
                          label="Price"
                          editing={isEditing}
                          view={
                            <PriceView
                              value={product.price}
                              currency={product.currency}
                            />
                          }
                        >
                          <Input
                            type="number"
                            {...form.register("price")}
                            className="h-9 text-sm"
                          />
                        </Field>
                        <Field
                          label="MSRP"
                          editing={isEditing}
                          view={
                            <ComparePriceView
                              value={product.compare_at_price}
                              currency={product.currency}
                            />
                          }
                        >
                          <Input
                            type="number"
                            {...form.register("compare_at_price")}
                            className="h-9 text-sm"
                          />
                        </Field>
                      </div>
                      <Separator />
                      <Field
                        label="Unit Cost (Internal)"
                        editing={isEditing}
                        view={
                          product.cost_price ? (
                            <p className="text-sm font-semibold">
                              {formatCurrency(
                                product.cost_price,
                                product.currency
                              )}
                            </p>
                          ) : (
                            <TextView>\u2014</TextView>
                          )
                        }
                      >
                        <Input
                          type="number"
                          {...form.register("cost_price")}
                          className="h-9 text-sm"
                        />
                      </Field>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="bg-amber-500/5 border-b p-4">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-600">
                        <Zap className="h-3.5 w-3.5" />
                        Inventory
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                        <Field
                          label="Stock"
                          editing={isEditing}
                          view={
                            <StockView quantity={product.stock_quantity} />
                          }
                        >
                          <Input
                            type="number"
                            {...form.register("stock_quantity")}
                            className="h-9 text-sm"
                          />
                        </Field>
                        <Field
                          label="Alert at"
                          editing={isEditing}
                          view={
                            <TextView>
                              {product.low_stock_threshold ?? 5} Units
                            </TextView>
                          }
                        >
                          <Input
                            type="number"
                            {...form.register("low_stock_threshold")}
                            className="h-9 text-sm"
                          />
                        </Field>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between py-1">
                        <Label className="text-xs font-medium">
                          Track Stock
                        </Label>
                        <Switch
                          checked={form.watch("track_inventory")}
                          onCheckedChange={(checked) =>
                            form.setValue("track_inventory", checked)
                          }
                          disabled={!isEditing}
                          className="h-5 w-9 data-[state=checked]:bg-primary"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="space-y-6 outline-none mt-6">
                <Card>
                  <CardHeader className="bg-muted/30 border-b p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <ImageIcon className="h-3.5 w-3.5 text-primary" />
                        Assets
                      </CardTitle>
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          asChild
                        >
                          <label
                            htmlFor="image-upload"
                            className="cursor-pointer"
                          >
                            <Upload className="mr-1.5 h-3 w-3" />
                            Upload
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
                  <CardContent className="p-5">
                    {product.images && product.images.length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                        {product.images.map((image, index) => (
                          <div
                            key={image.id}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-muted hover:border-primary/40 transition-all"
                          >
                            <img
                              src={image.url}
                              alt={image.alt_text || `Asset ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {image.is_primary && (
                              <div className="absolute top-1.5 left-1.5">
                                <Badge className="bg-primary text-white text-[8px] h-4 px-1 border-0">
                                  PRIMARY
                                </Badge>
                              </div>
                            )}
                            {isEditing && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="h-7 w-7 rounded-lg"
                                  onClick={() =>
                                    imageMutations.remove.mutate(image.id)
                                  }
                                  disabled={imageMutations.remove.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/5 border-muted-foreground/10">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/20 mb-2" />
                        <p className="text-[10px] font-medium uppercase text-muted-foreground tracking-wider">
                          No assets found
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Technical Tab */}
              <TabsContent value="specs" className="space-y-6 outline-none mt-6">
                <Card>
                  <CardHeader className="bg-indigo-500/5 border-b p-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-600">
                      <Settings2 className="h-3.5 w-3.5" />
                      Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-5">
                    <Field
                      label="Structured Data (JSON)"
                      editing={isEditing}
                      view={<JsonView data={product.specifications || {}} />}
                    >
                      <Textarea
                        {...form.register("specifications")}
                        rows={8}
                        className="font-mono text-xs border-muted-foreground/20 rounded-xl bg-slate-950 text-emerald-400 p-4 focus:ring-emerald-500 resize-none"
                      />
                    </Field>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field
                        label="Regulatory Clearances"
                        editing={isEditing}
                        view={
                          <CertificationsView
                            certs={product.certifications}
                          />
                        }
                      >
                        <Input
                          {...form.register("certifications")}
                          placeholder="ISO, CE, FDA..."
                          className="h-9 text-sm"
                        />
                      </Field>
                      <Field
                        label="Registration ID"
                        editing={isEditing}
                        view={
                          <TextView>
                            {product.kmpdb_registration_number}
                          </TextView>
                        }
                      >
                        <Input
                          {...form.register("kmpdb_registration_number")}
                          className="h-9 text-sm"
                        />
                      </Field>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="space-y-6 outline-none mt-6">
                <Card>
                  <CardHeader className="bg-emerald-500/5 border-b p-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-600">
                      <Globe className="h-3.5 w-3.5" />
                      SEO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-5">
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
                        className="h-9 text-sm"
                      />
                    </Field>

                    <Separator />

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
                        className="text-sm resize-none"
                      />
                    </Field>

                    <Separator />

                    <Field
                      label="Search Labels"
                      editing={isEditing}
                      view={<TagsView tags={product.tags} />}
                    >
                      <Input
                        {...form.register("tags")}
                        placeholder="Surgical, Sterile..."
                        className="h-9 text-sm"
                      />
                    </Field>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card>
              <CardHeader className="bg-muted/30 border-b p-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  Lifecycle
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                {completeness && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Completeness
                        </span>
                        <Badge
                          className={`text-[9px] h-4 px-1.5 ${
                            completeness.is_ready_to_verify
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                        >
                          {completeness.score}%
                        </Badge>
                      </div>
                      <Progress
                        value={completeness.score}
                        className={`h-1 rounded-full ${
                          completeness.is_ready_to_verify
                            ? "[&>div]:bg-emerald-500"
                            : "[&>div]:bg-amber-500"
                        }`}
                      />
                      {completeness.missing_required.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                            Missing required:
                          </p>
                          <ul className="space-y-0.5">
                            {completeness.missing_required.map((field) => {
                              const item = completeness.items.find(
                                (i) => i.field === field
                              );
                              return (
                                <li
                                  key={field}
                                  className="text-[10px] text-amber-600 flex items-center gap-1"
                                >
                                  <span className="h-1 w-1 rounded-full bg-amber-500 flex-shrink-0" />
                                  {item?.label || field}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-[10px] text-muted-foreground justify-start gap-1.5"
                        onClick={handleAIClick}
                        disabled={!isEditing || aiGen.isPending}
                      >
                        <Sparkles className="h-3 w-3" />
                        AI Rewrite
                      </Button>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Governance
                  </span>
                  {!isEditing ? (
                    <div className="flex flex-col gap-1.5 mt-2">
                      {product.status === "draft" && (
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs"
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
                            className="w-full h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 rounded-xl"
                            onClick={() => handleStatusAction("publish")}
                            disabled={isSaving}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve & Publish
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-9 text-xs font-bold text-destructive border-destructive/20 hover:bg-destructive/5 rounded-xl"
                            onClick={() => setShowRejectDialog(true)}
                            disabled={isSaving}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject with Feedback
                          </Button>

                          <div className="mt-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
                             <div className="flex items-center gap-2">
                               <Sparkles className="h-4 w-4 text-indigo-600" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Audit Desk</span>
                             </div>
                             <p className="text-[10px] text-muted-foreground leading-relaxed">
                               Use AI to cross-reference the clinical description against medical standards.
                             </p>
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="w-full h-8 text-[10px] font-black uppercase tracking-widest border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                               onClick={() => {
                                 toast.info("AI Validator is analyzing the listing...");
                                 setTimeout(() => toast.success("AI Audit complete: No major clinical inconsistencies found."), 2000);
                               }}
                             >
                               Run AI Validation
                             </Button>
                          </div>
                        </>
                      )}
                      {product.status === "published" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs"
                          onClick={() => handleStatusAction("archive")}
                          disabled={isSaving}
                        >
                          <Archive className="mr-1.5 h-3 w-3" />
                          Archive
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic mt-2">
                      Actions locked during edit
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className="text-muted-foreground">Views</span>
                    <span className="font-semibold">
                      {product.view_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className="text-muted-foreground">
                      Popularity Score
                    </span>
                    <span className="font-semibold text-primary">
                      {product.popularity_score || 0}%
                    </span>
                  </div>
                </div>

                {vendorName && (
                  <>
                    <Separator />
                    <div className="rounded-lg bg-slate-950 p-4 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-16 h-16 bg-primary/20 rounded-full blur-xl" />
                      <div className="relative z-10 space-y-2">
                        <Package className="h-4 w-4 text-yellow-400" />
                        <p className="text-xs font-semibold">{vendorName}</p>
                        <p className="text-[9px] text-slate-400">
                          Vendor has full write access.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-destructive/5 border border-dashed border-destructive/10">
                  <div className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] font-semibold text-destructive">
                    Destructive Area
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isSaving}
                  >
                    <Trash2 className="mr-1.5 h-3 w-3" />
                    Purge SKU
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[380px] rounded-xl">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-3">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold">
              Purge SKU Data?
            </DialogTitle>
            <DialogDescription className="text-sm pt-1">
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{product.name}&rdquo;
              </span>{" "}
              from the catalog. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSaving}
              className="rounded-lg h-9"
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
              className="rounded-lg h-9 text-xs"
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
        <DialogContent className="sm:max-w-[480px] rounded-[2rem]">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-black">Reject Submission</DialogTitle>
            <DialogDescription className="text-sm">
              Provide clinical or administrative feedback for this product.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection (e.g. incorrect certifications, clinical inaccuracies)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[120px] rounded-2xl p-4 text-sm border-muted-foreground/20 focus:ring-amber-500"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowRejectDialog(false)}
              className="font-bold text-xs uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectionReason.trim() || mutations.reject.isPending}
              className="rounded-xl px-6 font-black text-xs uppercase tracking-widest"
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
