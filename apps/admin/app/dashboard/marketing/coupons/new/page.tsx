"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Search, Tag, Percent, DollarSign } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { shoppingService, catalogService } from "@mymeddevices/shared-core";
import Link from "next/link";

export default function NewMarketingCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const [categorySearch, setCategorySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    coupon_type: "percentage",
    discount_value: "",
    discount_scope: "all_products",
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: "",
    min_order_value: "",
    max_discount_amount: "",
    global_usage_limit: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await catalogService.getCategories();
        setCategories(catRes || []);

        const prodRes = await catalogService.getVendorProducts({ page_size: 100 }) as any;
        setProducts(prodRes?.items || prodRes?.products || prodRes || []);
      } catch (err) {
        console.error("Failed to load catalog data", err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    if (!formData.discount_value || Number(formData.discount_value) <= 0) {
      toast.error("Discount value must be greater than zero");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description || null,
        coupon_type: formData.coupon_type,
        discount_value: parseFloat(formData.discount_value),
        discount_scope: formData.discount_scope,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : new Date().toISOString(),
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        global_usage_limit: formData.global_usage_limit ? parseInt(formData.global_usage_limit) : null,
        applicable_category_ids: formData.discount_scope === "specific_categories" ? selectedCategories : [],
        applicable_product_ids: formData.discount_scope === "specific_products" ? selectedProducts : [],
      };

      await shoppingService.createCoupon(payload);
      toast.success("Coupon created successfully!");
      router.push("/dashboard/marketing/coupons");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const filteredCategories = categories.filter(c => 
    c.name?.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/marketing/coupons">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create Promo Coupon</h1>
            <p className="text-sm text-muted-foreground">Add a new discount code or buyer incentive.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" /> Basic Information
              </CardTitle>
              <CardDescription>Specify the coupon code, description, and discount value.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g. MED10OFF or NAIOBI500"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    className="font-mono uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupon_type">Discount Type</Label>
                  <Select
                    value={formData.coupon_type}
                    onValueChange={(val) => setFormData({ ...formData, coupon_type: val })}
                  >
                    <SelectTrigger id="coupon_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage OFF (%)</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount OFF (KSh)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_value">Discount Value *</Label>
                  <div className="relative">
                    <Input
                      id="discount_value"
                      type="number"
                      step="0.01"
                      placeholder={formData.coupon_type === "percentage" ? "15" : "500"}
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      required
                    />
                    <div className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">
                      {formData.coupon_type === "percentage" ? "%" : "KSh"}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_discount_amount">Cap Max Discount (KSh)</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    placeholder="e.g. 5000 (Optional)"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Internal / Customer Note</Label>
                <Textarea
                  id="description"
                  placeholder="e.g. 10% discount for first-time clinic purchases above KSh 20,000"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Scope and Limits */}
          <Card className="border shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" /> Scope & Redemption Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_scope">Application Scope</Label>
                  <Select
                    value={formData.discount_scope}
                    onValueChange={(val) => setFormData({ ...formData, discount_scope: val })}
                  >
                    <SelectTrigger id="discount_scope">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_products">All Catalog Products</SelectItem>
                      <SelectItem value="specific_categories">Specific Categories Only</SelectItem>
                      <SelectItem value="specific_products">Specific Products Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_order_value">Min Order Amount (KSh)</Label>
                  <Input
                    id="min_order_value"
                    type="number"
                    placeholder="e.g. 10000"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                  />
                </div>
              </div>

              {/* Dynamic Specific Category Selection */}
              {formData.discount_scope === "specific_categories" && (
                <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                  <Label className="text-xs font-semibold">Select Applicable Categories ({selectedCategories.length} selected)</Label>
                  <Input
                    placeholder="Filter categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="h-8 text-xs mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredCategories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          id={`cat-${cat.id}`}
                          checked={selectedCategories.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                          className="rounded border-input"
                        />
                        <label htmlFor={`cat-${cat.id}`} className="cursor-pointer">{cat.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Specific Product Selection */}
              {formData.discount_scope === "specific_products" && (
                <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                  <Label className="text-xs font-semibold">Select Applicable Products ({selectedProducts.length} selected)</Label>
                  <Input
                    placeholder="Filter products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="h-8 text-xs mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredProducts.map((prod) => (
                      <div key={prod.id} className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          id={`prod-${prod.id}`}
                          checked={selectedProducts.includes(prod.id)}
                          onChange={() => toggleProduct(prod.id)}
                          className="rounded border-input"
                        />
                        <label htmlFor={`prod-${prod.id}`} className="cursor-pointer font-medium">{prod.title}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_from">Valid From Date</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Valid Until Date</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="global_usage_limit">Global Uses Count Cap</Label>
                  <Input
                    id="global_usage_limit"
                    type="number"
                    placeholder="e.g. 500 (Unlimited if blank)"
                    value={formData.global_usage_limit}
                    onChange={(e) => setFormData({ ...formData, global_usage_limit: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/marketing/coupons">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving Coupon..." : "Create Coupon"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
