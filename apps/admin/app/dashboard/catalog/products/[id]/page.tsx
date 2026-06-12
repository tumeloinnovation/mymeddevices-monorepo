"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImageIcon,
  Upload,
  Sparkles,
} from "lucide-react";
import { catalogService, Product, ProductCompleteness, CategoryTree } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [completeness, setCompleteness] = useState<ProductCompleteness | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    short_description: "",
    sku: "",
    category_id: "",
    brand: "",
    manufacturer: "",
    model_number: "",
    price: "",
    compare_at_price: "",
    cost_price: "",
    currency: "KES",
    stock_quantity: "",
    low_stock_threshold: "",
    track_inventory: true,
    weight_kg: "",
    specifications: "",
    certifications: "",
    kmpdb_registration_number: "",
    ppb_classification: "",
    ce_marking_or_fda_clearance: "",
    warranty_info: "",
    meta_title: "",
    meta_description: "",
    tags: [] as string[],
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [productData, completenessData, categoriesData] = await Promise.all([
          catalogService.getProduct(productId),
          catalogService.getCompleteness(productId),
          catalogService.getCategories(),
        ]);

        setProduct(productData);
        setCompleteness(completenessData);

        // Flatten categories
        const flatCategories: CategoryTree[] = [];
        const flatten = (catList: CategoryTree[]) => {
          catList.forEach((cat) => {
            flatCategories.push(cat);
            if (cat.children?.length > 0) flatten(cat.children);
          });
        };
        flatten(categoriesData);
        setCategories(flatCategories);

        // Set form data
        setFormData({
          name: productData.name || "",
          slug: productData.slug || "",
          description: productData.description || "",
          short_description: productData.short_description || "",
          sku: productData.sku || "",
          category_id: productData.category_id || "",
          brand: productData.brand || "",
          manufacturer: productData.manufacturer || "",
          model_number: productData.model_number || "",
          price: productData.price?.toString() || "",
          compare_at_price: productData.compare_at_price?.toString() || "",
          cost_price: productData.cost_price?.toString() || "",
          currency: productData.currency || "KES",
          stock_quantity: productData.stock_quantity?.toString() || "0",
          low_stock_threshold: productData.low_stock_threshold?.toString() || "5",
          track_inventory: productData.track_inventory ?? true,
          weight_kg: productData.weight_kg?.toString() || "",
          specifications: JSON.stringify(productData.specifications || {}, null, 2),
          certifications: (productData.certifications || []).join(", "),
          kmpdb_registration_number: productData.kmpdb_registration_number || "",
          ppb_classification: productData.ppb_classification || "",
          ce_marking_or_fda_clearance: productData.ce_marking_or_fda_clearance || "",
          warranty_info: productData.warranty_info || "",
          meta_title: productData.meta_title || "",
          meta_description: productData.meta_description || "",
          tags: productData.tags || [],
        });
      } catch (error: any) {
        toast.error(error.message || "Failed to load product");
        router.push("/dashboard/catalog/products");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [productId, router]);

  const handleSave = async () => {
    if (!product) return;

    setSaving(true);
    try {
      // Parse specifications safely
      let specifications;
      if (formData.specifications) {
        try {
          specifications = JSON.parse(formData.specifications);
        } catch (e) {
          toast.error("Invalid JSON in specifications field");
          setSaving(false);
          return;
        }
      }

      const updateData: any = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        short_description: formData.short_description || undefined,
        sku: formData.sku || undefined,
        category_id: formData.category_id || undefined,
        brand: formData.brand || undefined,
        manufacturer: formData.manufacturer || undefined,
        model_number: formData.model_number || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : undefined,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        currency: formData.currency,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
        track_inventory: formData.track_inventory,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        specifications,
        certifications: formData.certifications ? formData.certifications.split(", ").filter(Boolean) : undefined,
        kmpdb_registration_number: formData.kmpdb_registration_number || undefined,
        ppb_classification: formData.ppb_classification || undefined,
        ce_marking_or_fda_clearance: formData.ce_marking_or_fda_clearance || undefined,
        warranty_info: formData.warranty_info || undefined,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined,
      };

      const updated = await catalogService.updateProduct(productId, updateData);
      setProduct(updated);
      setIsEditing(false);
      toast.success("Product updated successfully");

      // Reload completeness
      const newCompleteness = await catalogService.getCompleteness(productId);
      setCompleteness(newCompleteness);
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (action: "verify" | "publish" | "archive") => {
    setSaving(true);
    try {
      let updated;
      switch (action) {
        case "verify":
          updated = await catalogService.verifyProduct(productId);
          toast.success("Product submitted for review");
          break;
        case "publish":
          updated = await catalogService.publishProduct(productId);
          toast.success("Product published successfully");
          break;
        case "archive":
          updated = await catalogService.archiveProduct(productId);
          toast.success("Product archived");
          break;
      }
      setProduct(updated);
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} product`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await catalogService.deleteProduct(productId);
      toast.success("Product deleted successfully");
      router.push("/dashboard/catalog/products");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      await catalogService.uploadImage(productId, file, {
        is_primary: !product?.images?.length,
      });
      toast.success("Image uploaded successfully");

      // Reload product
      const updated = await catalogService.getProduct(productId);
      setProduct(updated);

      const newCompleteness = await catalogService.getCompleteness(productId);
      setCompleteness(newCompleteness);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setSaving(false);
    }
  };

  const handleImageDelete = async (imageId: string) => {
    setSaving(true);
    try {
      await catalogService.removeImage(productId, imageId);
      toast.success("Image removed");

      const updated = await catalogService.getProduct(productId);
      setProduct(updated);
    } catch (error: any) {
      toast.error(error.message || "Failed to remove image");
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = async () => {
    setSaving(true);
    try {
      const result = await catalogService.getAiSuggestions(productId, {
        fields_to_generate: ["description", "short_description", "meta_title", "meta_description"],
      });

      if (result.suggestions) {
        setFormData((prev) => ({
          ...prev,
          description: result.suggestions.description || prev.description,
          short_description: result.suggestions.short_description || prev.short_description,
          meta_title: result.suggestions.meta_title || prev.meta_title,
          meta_description: result.suggestions.meta_description || prev.meta_description,
        }));
        toast.success("AI content generated. Review and save to apply.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate AI content");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!product) return null;

  const getStatusBadge = () => {
    const config: Record<string, { label: string; color: string }> = {
      draft: { label: "Draft", color: "bg-gray-100 text-gray-700 border-gray-200" },
      pending_review: { label: "Pending Review", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      published: { label: "Published", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      archived: { label: "Archived", color: "bg-slate-100 text-slate-700 border-slate-200" },
    };
    const { label, color } = config[product.status] || config.draft;
    return <Badge variant="outline" className={color}>{label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/catalog/products">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{product.name}</h1>
                {getStatusBadge()}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                SKU: {product.sku || "Not set"} • ID: {product.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview on Storefront
                  </Link>
                </Button>
                {product.status === "draft" && (
                  <Button onClick={() => handleStatusChange("verify")} disabled={saving}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit for Review
                  </Button>
                )}
                {product.status === "pending_review" && (
                  <Button onClick={() => handleStatusChange("publish")} disabled={saving}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve & Publish
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Completeness Score */}
        {completeness && (
          <Card className={completeness.is_ready_to_verify ? "border-emerald-200 bg-emerald-50/30" : "border-yellow-200 bg-yellow-50/30"}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {completeness.is_ready_to_verify ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <h3 className="font-semibold">
                      {completeness.is_ready_to_verify
                        ? "Product is ready for review"
                        : "Product needs more information"}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Completeness score: {completeness.score}% of required fields completed
                  </p>
                  <Progress value={completeness.score} className="mb-4" />
                  {!completeness.is_ready_to_verify && completeness.missing_required.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Missing required fields:</span>
                      <span className="text-muted-foreground ml-2">
                        {completeness.missing_required.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={handleAIGenerate} disabled={saving}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Assist
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="seo">SEO & Metadata</TabsTrigger>
          </TabsList>

          {/* General Info Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>Basic product details and categorization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{product.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL)</Label>
                    {isEditing ? (
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">/{product.slug}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    {isEditing ? (
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{product.sku || "Not set"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    {isEditing ? (
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{product.category_name || "Not set"}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description</Label>
                  {isEditing ? (
                    <Textarea
                      id="short_description"
                      value={formData.short_description}
                      onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm">{product.short_description || "Not set"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Description</Label>
                  {isEditing ? (
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                    />
                  ) : (
                    <div className="text-sm whitespace-pre-wrap">{product.description || "Not set"}</div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    {isEditing ? (
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{product.brand || "Not set"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    {isEditing ? (
                      <Input
                        id="manufacturer"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{product.manufacturer || "Not set"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model Number</Label>
                    {isEditing ? (
                      <Input
                        id="model"
                        value={formData.model_number}
                        onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{product.model_number || "Not set"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing & Inventory Tab */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>Set product pricing and currency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Selling Price *</Label>
                    {isEditing ? (
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium">
                        {product.price ? `${product.currency} ${product.price.toFixed(2)}` : "Not set"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compare">Compare at Price</Label>
                    {isEditing ? (
                      <Input
                        id="compare"
                        type="number"
                        step="0.01"
                        value={formData.compare_at_price}
                        onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{product.compare_at_price || "Not set"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost Price</Label>
                    {isEditing ? (
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        value={formData.cost_price}
                        onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{product.cost_price || "Not set"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    {isEditing ? (
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KES">KES</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{product.currency}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>Track stock levels and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    {isEditing ? (
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium">{product.stock_quantity}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Low Stock Threshold</Label>
                    {isEditing ? (
                      <Input
                        id="threshold"
                        type="number"
                        value={formData.low_stock_threshold}
                        onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{product.low_stock_threshold}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    {isEditing ? (
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        value={formData.weight_kg}
                        onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{product.weight_kg || "Not set"}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="track-inventory"
                    checked={formData.track_inventory}
                    onCheckedChange={(checked) => setFormData({ ...formData, track_inventory: checked })}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="track-inventory">Track inventory for this product</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>Upload and manage product images</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.images && product.images.length > 0 ? (
                  <div className="grid grid-cols-4 gap-4">
                    {product.images.map((image, index) => (
                      <div
                        key={image.id}
                        className="relative group aspect-square rounded-lg overflow-hidden border"
                      >
                        <img
                          src={image.url}
                          alt={image.alt_text || `Product image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {image.is_primary && (
                          <Badge className="absolute top-2 left-2">Primary</Badge>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleImageDelete(image.id)}
                            disabled={saving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No images uploaded yet</p>
                  </div>
                )}
                <div className="flex justify-center">
                  <Button variant="outline" asChild>
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={saving}
                      />
                    </label>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Specifications Tab */}
          <TabsContent value="specifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Specifications</CardTitle>
                <CardDescription>Technical details and certifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="specifications">Specifications (JSON)</Label>
                  {isEditing ? (
                    <Textarea
                      id="specifications"
                      value={formData.specifications}
                      onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                      rows={6}
                      className="font-mono text-sm"
                    />
                  ) : (
                    <pre className="text-sm bg-muted p-3 rounded">
                      {JSON.stringify(product.specifications, null, 2)}
                    </pre>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kmpdb">KMPDB Registration Number</Label>
                    {isEditing ? (
                      <Input
                        id="kmpdb"
                        value={formData.kmpdb_registration_number}
                        onChange={(e) => setFormData({ ...formData, kmpdb_registration_number: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{product.kmpdb_registration_number || "Not set"}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ppb">PPB Classification</Label>
                    {isEditing ? (
                      <Input
                        id="ppb"
                        value={formData.ppb_classification}
                        onChange={(e) => setFormData({ ...formData, ppb_classification: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{product.ppb_classification || "Not set"}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                  {isEditing ? (
                    <Input
                      id="certifications"
                      value={formData.certifications}
                      onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                      placeholder="ISO 13485, CE Mark, FDA cleared"
                    />
                  ) : (
                    <p className="text-sm">{product.certifications?.join(", ") || "Not set"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty">Warranty Information</Label>
                  {isEditing ? (
                    <Textarea
                      id="warranty"
                      value={formData.warranty_info}
                      onChange={(e) => setFormData({ ...formData, warranty_info: e.target.value })}
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm">{product.warranty_info || "Not set"}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SEO & Metadata</CardTitle>
                <CardDescription>Optimize for search engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  {isEditing ? (
                    <Input
                      id="meta_title"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      placeholder="Product name for search results"
                    />
                  ) : (
                    <p className="text-sm">{product.meta_title || "Not set"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  {isEditing ? (
                    <Textarea
                      id="meta_description"
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      rows={3}
                      placeholder="Brief description for search results"
                    />
                  ) : (
                    <p className="text-sm">{product.meta_description || "Not set"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  {isEditing ? (
                    <Input
                      id="tags"
                      value={formData.tags.join(", ")}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                      placeholder="e.g. surgical, disposable, diagnostic"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {product.tags && product.tags.length > 0 ? (
                        product.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">{tag}</Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No tags set</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Product</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this product and all associated data
                </p>
              </div>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Product
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
