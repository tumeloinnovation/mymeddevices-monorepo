"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LayoutDashboard,
  ChevronRight,
  FileText,
  ShoppingCart,
  Zap,
  Globe,
  Settings2,
  ShieldCheck,
  Plus,
  Box,
} from "lucide-react";
import { catalogService, CategoryTree } from "@mymeddevices/shared-core";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [activeTab, setActiveTab] = useState("general");

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
    stock_quantity: "0",
    low_stock_threshold: "5",
    track_inventory: true,
    weight_kg: "",
    specifications: "{}",
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
    async function loadCategories() {
      try {
        const categoriesData = await catalogService.getCategories();
        const flatCategories: CategoryTree[] = [];
        const flatten = (catList: CategoryTree[]) => {
          catList.forEach((cat) => {
            flatCategories.push(cat);
            if (cat.children?.length > 0) flatten(cat.children);
          });
        };
        flatten(categoriesData);
        setCategories(flatCategories);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }
    loadCategories();
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Please fill in required fields (Name and Price)");
      return;
    }

    setLoading(true);
    try {
      let specifications = {};
      try {
        specifications = JSON.parse(formData.specifications);
      } catch (e) {
        toast.error("Invalid JSON in specifications field");
        setLoading(false);
        return;
      }

      const createData: any = {
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        short_description: formData.short_description || undefined,
        sku: formData.sku || undefined,
        category_id: formData.category_id || undefined,
        brand: formData.brand || undefined,
        manufacturer: formData.manufacturer || undefined,
        model_number: formData.model_number || undefined,
        price: parseFloat(formData.price),
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
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      const product = await catalogService.createProduct(createData);
      toast.success("Product created successfully");
      router.push(`/dashboard/catalog/products/${product.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    const slug = name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1200px] mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-bold">
          <Link href="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/dashboard/catalog/products" className="hover:text-primary transition-colors">
            Products
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-bold text-foreground">New Product</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b pb-6">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <Plus className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Create Product</h1>
              <p className="text-muted-foreground text-sm font-medium mt-1">Initialize a new medical equipment listing.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-10 px-5 rounded-xl font-bold text-sm" asChild>
              <Link href="/dashboard/catalog/products">Cancel</Link>
            </Button>
            <Button className="h-10 px-6 rounded-xl font-black shadow-lg shadow-primary/20 text-sm" onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Publish Product
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
              <TabsList className="bg-muted/50 p-1.5 h-12 rounded-2xl w-full justify-start overflow-x-auto no-scrollbar border border-muted-foreground/10">
                <TabsTrigger value="general" className="px-6 rounded-xl h-9 data-[state=active]:bg-background data-[state=active]:shadow-md font-bold transition-all text-xs">General Info</TabsTrigger>
                <TabsTrigger value="pricing" className="px-6 rounded-xl h-9 data-[state=active]:bg-background data-[state=active]:shadow-md font-bold transition-all text-xs">Pricing</TabsTrigger>
                <TabsTrigger value="inventory" className="px-6 rounded-xl h-9 data-[state=active]:bg-background data-[state=active]:shadow-md font-bold transition-all text-xs">Inventory</TabsTrigger>
                <TabsTrigger value="specs" className="px-6 rounded-xl h-9 data-[state=active]:bg-background data-[state=active]:shadow-md font-bold transition-all text-xs">Specs & SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="outline-none">
                <Card className="shadow-xl shadow-foreground/5 border-muted/50 rounded-3xl">
                  <CardHeader className="bg-muted/20 border-b p-5">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Core Identity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Product Name *</Label>
                        <Input value={formData.name} onChange={(e) => generateSlug(e.target.value)} placeholder="e.g. MRI Scanner Model X" className="h-11 text-base font-bold border-muted-foreground/20 rounded-xl focus:ring-primary" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">URL Path (Slug)</Label>
                        <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="mri-scanner-model-x" className="h-11 border-muted-foreground/20 rounded-xl font-mono text-xs bg-muted/30" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-muted/50">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Category</Label>
                        <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                          <SelectTrigger className="h-11 border-muted-foreground/20 rounded-xl font-bold text-sm">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl shadow-2xl border-muted p-2">
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id} className="rounded-lg py-2.5 text-sm">{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Brand Name</Label>
                        <Input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g. GE Healthcare" className="h-11 border-muted-foreground/20 rounded-xl font-bold text-sm" />
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-muted/50">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Full Description</Label>
                      <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={6} className="border-muted-foreground/20 rounded-xl py-3 text-sm" placeholder="Detailed technical description and usage guide..." />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pricing" className="outline-none">
                <Card className="shadow-xl shadow-foreground/5 border-muted/50 rounded-3xl">
                  <CardHeader className="bg-primary/5 border-b p-5">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                      <ShoppingCart className="h-4 w-4" />
                      Commercial Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Retail Price *</Label>
                        <div className="relative">
                          <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="h-11 pl-11 text-lg font-black rounded-xl border-primary/20 bg-primary/5" placeholder="0.00" required />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-sm">KES</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Compare At Price</Label>
                        <div className="relative">
                          <Input type="number" value={formData.compare_at_price} onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })} className="h-11 pl-11 rounded-xl text-muted-foreground border-muted-foreground/20 text-sm font-bold" placeholder="0.00" />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">KES</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inventory" className="outline-none">
                <Card className="shadow-xl shadow-foreground/5 border-muted/50 rounded-3xl">
                  <CardHeader className="bg-amber-500/5 border-b p-5">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-600">
                      <Zap className="h-4 w-4" />
                      Stock Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">SKU Identifier</Label>
                        <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="e.g. MRI-102-X" className="h-11 border-muted-foreground/20 rounded-xl font-mono font-bold text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Initial Stock</Label>
                        <Input type="number" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} className="h-11 text-base font-black rounded-xl border-muted-foreground/20" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Alert Level</Label>
                        <Input type="number" value={formData.low_stock_threshold} onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })} className="h-11 rounded-xl border-muted-foreground/20 text-sm font-bold" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-muted-foreground/10">
                      <div className="flex flex-col gap-0.5">
                        <Label className="text-sm font-bold">Track Inventory</Label>
                        <p className="text-[10px] text-muted-foreground font-bold">Auto-deduct stock on successful orders</p>
                      </div>
                      <Switch checked={formData.track_inventory} onCheckedChange={(checked) => setFormData({ ...formData, track_inventory: checked })} className="data-[state=checked]:bg-primary" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="specs" className="outline-none">
                <Card className="shadow-xl shadow-foreground/5 border-muted/50 rounded-3xl">
                  <CardHeader className="bg-indigo-500/5 border-b p-5">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-600">
                      <Settings2 className="h-4 w-4" />
                      Technical & SEO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Regulatory ID (KMPDB)</Label>
                      <Input value={formData.kmpdb_registration_number} onChange={(e) => setFormData({ ...formData, kmpdb_registration_number: e.target.value })} placeholder="KMPDB/REG/..." className="h-11 border-muted-foreground/20 rounded-xl font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">SEO Meta Title</Label>
                      <Input value={formData.meta_title} onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })} placeholder="Optimal for search engines" className="h-11 border-muted-foreground/20 rounded-xl font-bold text-sm" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1 space-y-6">
             <Card className="shadow-lg border-muted/50 rounded-3xl">
               <CardHeader className="bg-muted/20 border-b p-5">
                 <CardTitle className="text-sm font-bold flex items-center gap-2">
                   <ShieldCheck className="h-4 w-4 text-emerald-600" />
                   Publishing Guard
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-5 space-y-4">
                 <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                   New products are initialized as <span className="font-bold text-foreground italic">Drafts</span>. After creation, you can upload images and submit for review.
                 </p>
                 <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 border-dashed">
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mb-3">Checklist:</p>
                   <ul className="space-y-2">
                     <li className="flex items-center gap-2 text-[10px] font-black uppercase"><div className={`h-1.5 w-1.5 rounded-full ${formData.name ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-muted-foreground/30"}`} /> Name defined</li>
                     <li className="flex items-center gap-2 text-[10px] font-black uppercase"><div className={`h-1.5 w-1.5 rounded-full ${formData.price ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-muted-foreground/30"}`} /> Price set</li>
                     <li className="flex items-center gap-2 text-[10px] font-black uppercase"><div className={`h-1.5 w-1.5 rounded-full ${formData.category_id ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-muted-foreground/30"}`} /> Category set</li>
                   </ul>
                 </div>
               </CardContent>
             </Card>

             <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-24 h-24 bg-primary/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
               <div className="relative z-10 flex flex-col gap-4">
                 <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-lg">
                   <Box className="h-5 w-5 text-primary" />
                 </div>
                 <h3 className="text-lg font-black tracking-tight">Catalog Strategy</h3>
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                   Enforce quality standards across the storefront.
                 </p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
