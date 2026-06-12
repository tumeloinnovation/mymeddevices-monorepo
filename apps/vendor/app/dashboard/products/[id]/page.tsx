"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  Save, 
  Loader2, 
  Sparkles, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Archive,
  Star,
  Globe,
  Tag,
  Stethoscope,
  Info,
  LayoutGrid
} from "lucide-react";
import { 
  catalogService, 
  Product, 
  CategoryTree,
  ProductCompleteness,
  ProductUpdate
} from "@mymeddevices/shared-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [completeness, setCompleteness] = useState<ProductCompleteness | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ProductUpdate>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productData, categoriesData, completenessData] = await Promise.all([
        catalogService.getProduct(id),
        catalogService.getCategories(),
        catalogService.getCompleteness(id)
      ]);
      setProduct(productData);
      setCategories(categoriesData);
      setCompleteness(completenessData);
      
      // Initialize form data
      setFormData({
        name: productData.name,
        category_id: productData.category_id,
        sku: productData.sku,
        description: productData.description,
        short_description: productData.short_description,
        brand: productData.brand,
        model_number: productData.model_number,
        manufacturer: productData.manufacturer,
        base_price: productData.base_price,
        stock_quantity: productData.stock_quantity,
        low_stock_threshold: productData.low_stock_threshold,
        track_inventory: productData.track_inventory,
        weight_kg: productData.weight_kg,
        kmpdb_registration_number: productData.kmpdb_registration_number,
        ppb_classification: productData.ppb_classification,
        ce_marking_or_fda_clearance: productData.ce_marking_or_fda_clearance,
        warranty_info: productData.warranty_info,
        meta_title: productData.meta_title,
        meta_description: productData.meta_description,
        tags: productData.tags,
      });
    } catch (error) {
      toast.error("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleInputChange = (field: keyof ProductUpdate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await catalogService.updateProduct(id, formData);
      setProduct(updated);
      toast.success("Product updated successfully");
      
      // Refresh completeness
      const compData = await catalogService.getCompleteness(id);
      setCompleteness(compData);
    } catch (error) {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyAndPublish = async () => {
    try {
      setSaving(true);
      await catalogService.verifyProduct(id);
      await catalogService.publishProduct(id);
      toast.success("Product verified and published!");
      router.push("/dashboard/products");
    } catch (error: any) {
      toast.error(error.message || "Failed to publish product");
    } finally {
      setSaving(false);
    }
  };

  const handleAiAssist = async () => {
    setAiGenerating(true);
    try {
      const response = await catalogService.getAiSuggestions(id, {
        fields_to_generate: ["description", "short_description", "tags", "meta_title", "meta_description"]
      });
      
      setFormData(prev => ({
        ...prev,
        ...response.suggestions
      }));
      
      toast.success("AI suggestions generated and applied to form");
    } catch (error) {
      toast.error("AI assistant failed");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Uploading image...");
    try {
      await catalogService.uploadImage(id, file);
      toast.success("Image uploaded", { id: toastId });
      fetchData(); // Refresh everything to get new images
    } catch (error) {
      toast.error("Upload failed", { id: toastId });
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    try {
      await catalogService.removeImage(id, imageId);
      toast.success("Image removed");
      fetchData();
    } catch (error) {
      toast.error("Failed to remove image");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) return <div>Product not found</div>;

  const flattenedCategories: { id: string, name: string }[] = [];
  const flatten = (cats: CategoryTree[], prefix = "") => {
    cats.forEach(cat => {
      flattenedCategories.push({ id: cat.id, name: prefix + cat.name });
      if (cat.children && cat.children.length > 0) {
        flatten(cat.children, prefix + cat.name + " > ");
      }
    });
  };
  flatten(categories);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-8">
            <Link href="/dashboard/products">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
              <Badge variant={product.status === 'published' ? 'default' : 'outline'}>
                {product.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">ID: {product.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
          {completeness?.is_ready_to_verify && product.status === 'draft' && (
            <Button onClick={handleVerifyAndPublish} disabled={saving}>
              <CheckCircle2 className="size-4 mr-2" />
              Verify & Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="general">General Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="medical">Medical Specifics</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Basic Details</CardTitle>
                    <CardDescription>Main information about the device.</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAiAssist}
                    disabled={aiGenerating}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    {aiGenerating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Sparkles className="size-4 mr-2" />}
                    AI Assist
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Product Name</Label>
                      <Input 
                        id="edit-name" 
                        value={formData.name || ""} 
                        onChange={e => handleInputChange('name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-sku">SKU / Model Number</Label>
                      <Input 
                        id="edit-sku" 
                        value={formData.sku || ""} 
                        onChange={e => handleInputChange('sku', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select 
                      value={formData.category_id || ""} 
                      onValueChange={val => handleInputChange('category_id', val)}
                    >
                      <SelectTrigger id="edit-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {flattenedCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-short-desc">Short Description (Summary)</Label>
                    <Textarea 
                      id="edit-short-desc" 
                      className="h-20"
                      value={formData.short_description || ""} 
                      onChange={e => handleInputChange('short_description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-desc">Full Description / Features</Label>
                    <Textarea 
                      id="edit-desc" 
                      className="h-40"
                      value={formData.description || ""} 
                      onChange={e => handleInputChange('description', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Brand & Manufacturer</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-brand">Brand</Label>
                    <Input 
                      id="edit-brand" 
                      value={formData.brand || ""} 
                      onChange={e => handleInputChange('brand', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-manufacturer">Manufacturer</Label>
                    <Input 
                      id="edit-manufacturer" 
                      value={formData.manufacturer || ""} 
                      onChange={e => handleInputChange('manufacturer', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                  <CardDescription>Set your selling price. Our system will handle commissions.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Base Price (KES)</Label>
                    <Input 
                      id="edit-price" 
                      type="number"
                      value={formData.base_price || 0} 
                      onChange={e => handleInputChange('base_price', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-2">
                    <p className="text-sm text-muted-foreground italic">
                      Final Store Price: KES {(formData.base_price || 0) * 1.15} (Estimate with 15% commission)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory & Shipping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="track-inventory" 
                      checked={formData.track_inventory} 
                      onCheckedChange={(checked) => handleInputChange('track_inventory', !!checked)}
                    />
                    <Label htmlFor="track-inventory">Track inventory level</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock">Available Stock</Label>
                      <Input 
                        id="stock" 
                        type="number"
                        value={formData.stock_quantity || 0} 
                        onChange={e => handleInputChange('stock_quantity', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="threshold">Low Stock Alert Threshold</Label>
                      <Input 
                        id="threshold" 
                        type="number"
                        value={formData.low_stock_threshold || 5} 
                        onChange={e => handleInputChange('low_stock_threshold', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input 
                      id="weight" 
                      type="number"
                      step="0.01"
                      value={formData.weight_kg || ""} 
                      onChange={e => handleInputChange('weight_kg', parseFloat(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                  <CardDescription>Upload high-quality images of the device. First image is the primary thumbnail.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {product.images.map((image) => (
                      <div key={image.id} className="relative group aspect-square border rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={image.url} 
                          alt={image.alt_text || product.name} 
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="size-8"
                            onClick={() => handleRemoveImage(image.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        {image.is_primary && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-white text-black hover:bg-white/90">Primary</Badge>
                          </div>
                        )}
                      </div>
                    ))}
                    <label className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="size-6 text-muted-foreground" />
                      <span className="text-sm font-medium">Upload Image</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medical" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Regulatory & Compliance</CardTitle>
                  <CardDescription>Required for medical devices in Kenya.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kmpdb">KMPDB Registration No.</Label>
                      <Input 
                        id="kmpdb" 
                        value={formData.kmpdb_registration_number || ""} 
                        onChange={e => handleInputChange('kmpdb_registration_number', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ppb">PPB Classification</Label>
                      <Input 
                        id="ppb" 
                        value={formData.ppb_classification || ""} 
                        onChange={e => handleInputChange('ppb_classification', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ce">CE Marking / FDA Clearance</Label>
                    <Input 
                      id="ce" 
                      value={formData.ce_marking_or_fda_clearance || ""} 
                      onChange={e => handleInputChange('ce_marking_or_fda_clearance', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warranty">Warranty Information</Label>
                    <Textarea 
                      id="warranty" 
                      value={formData.warranty_info || ""} 
                      onChange={e => handleInputChange('warranty_info', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Search Optimization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta-title">Meta Title</Label>
                    <Input 
                      id="meta-title" 
                      value={formData.meta_title || ""} 
                      onChange={e => handleInputChange('meta_title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta-desc">Meta Description</Label>
                    <Textarea 
                      id="meta-desc" 
                      value={formData.meta_description || ""} 
                      onChange={e => handleInputChange('meta_description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input 
                      id="tags" 
                      value={formData.tags?.join(', ') || ""} 
                      onChange={e => handleInputChange('tags', e.target.value.split(',').map(s => s.trim()))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completeness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Progress</span>
                  <span>{completeness?.score || 0}%</span>
                </div>
                <Progress value={completeness?.score || 0} className="h-2" />
              </div>
              
              <div className="space-y-3 pt-2">
                {completeness?.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    {item.is_complete ? (
                      <CheckCircle2 className="size-4 text-green-500 mt-0.5" />
                    ) : (
                      <AlertCircle className={item.is_required ? "size-4 text-destructive mt-0.5" : "size-4 text-muted-foreground mt-0.5"} />
                    )}
                    <span className={item.is_complete ? "text-muted-foreground" : item.is_required ? "font-medium text-foreground" : "text-muted-foreground"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {!completeness?.is_ready_to_verify && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
                  <Info className="size-4 shrink-0" />
                  <p>Complete all required fields to publish this product to the storefront.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Eye className="size-4" /> Views</span>
                <span className="font-medium">{product.view_count}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Star className="size-4" /> Score</span>
                <span className="font-medium">{product.popularity_score}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Tag className="size-4" /> Sales</span>
                <span className="font-medium">{product.is_on_sale ? "On Sale" : "Standard"}</span>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground" size="sm" asChild>
                <a href={`/products/${product.slug}`} target="_blank">
                  <ExternalLink className="size-4 mr-2" />
                  Storefront Preview
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
