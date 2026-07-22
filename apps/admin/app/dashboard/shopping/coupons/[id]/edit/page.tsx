"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Search } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { shoppingService, catalogService, Coupon } from "@mymeddevices/shared-core";
import Link from "next/link";

export default function EditCouponPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Search inputs
  const [categorySearch, setCategorySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    coupon_type: "percentage",
    discount_value: "",
    discount_scope: "all_products",
    is_active: true,
    valid_from: "",
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

  useEffect(() => {
    if (id) loadCoupon();
  }, [id]);

  const loadCoupon = async () => {
    setLoading(true);
    try {
      const response = await shoppingService.getCoupon(id as string);
      const c = response as any;
      const coupon: Coupon = c.data ?? c;
      setFormData({
        code: coupon.code,
        description: coupon.description || "",
        coupon_type: coupon.coupon_type,
        discount_value: coupon.discount_value.toString(),
        discount_scope: coupon.discount_scope,
        is_active: coupon.is_active,
        valid_from: coupon.valid_from ? coupon.valid_from.split("T")[0] : new Date().toISOString().split("T")[0],
        valid_until: coupon.valid_until ? coupon.valid_until.split("T")[0] : "",
        min_order_value: coupon.min_order_value?.toString() || "",
        max_discount_amount: coupon.max_discount_amount?.toString() || "",
        global_usage_limit: coupon.global_usage_limit?.toString() || "",
      });
      setSelectedCategories((coupon as any).category_ids || []);
      setSelectedProducts((coupon as any).product_ids || []);
    } catch (error) {
      console.error("Failed to load coupon", error);
      toast.error("Failed to load coupon");
      router.push("/dashboard/shopping/coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: any = {
        description: formData.description,
        coupon_type: formData.coupon_type,
        discount_value: parseFloat(formData.discount_value),
        discount_scope: formData.discount_scope,
        is_active: formData.is_active,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        global_usage_limit: formData.global_usage_limit ? parseInt(formData.global_usage_limit) : null,
        category_ids: formData.discount_scope === "specific_categories" ? selectedCategories : [],
        product_ids: formData.discount_scope === "specific_products" ? selectedProducts : [],
      };

      await shoppingService.updateCoupon(id as string, payload);
      toast.success("Coupon updated successfully");
      router.push("/dashboard/shopping/coupons");
    } catch (error) {
      console.error("Failed to update coupon", error);
      toast.error("Failed to update coupon. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Filters categories and products based on search term
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredProducts = products.filter((prod) =>
    prod.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (prod.sku && prod.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl mx-auto px-4 py-4">
          <Skeleton className="h-10 w-48 bg-secondary/50" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 col-span-2 bg-secondary/50" />
            <Skeleton className="h-72 bg-secondary/50" />
            <Skeleton className="h-72 bg-secondary/50" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Link href="/dashboard/shopping/coupons">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Edit Coupon</h1>
            <p className="text-xs text-muted-foreground">
              Update properties of the promotional campaign.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card className="md:col-span-2 border-border bg-card">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Basic Information</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Core details (Note: Coupon code is read-only).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coupon Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    disabled
                    className="uppercase bg-secondary/40 border-border text-foreground/60 cursor-not-allowed"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide details about the discount scope or conditions..."
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={3}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Discount Configuration */}
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Discount Type</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Configure reward structure.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="coupon_type" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coupon Type</Label>
                  <Select
                    value={formData.coupon_type}
                    onValueChange={(value) => handleChange("coupon_type", value)}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="percentage" className="hover:bg-secondary focus:bg-secondary text-foreground">Percentage Discount</SelectItem>
                      <SelectItem value="fixed_amount" className="hover:bg-secondary focus:bg-secondary text-foreground">Fixed Amount Discount</SelectItem>
                      <SelectItem value="free_shipping" className="hover:bg-secondary focus:bg-secondary text-foreground">Free Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.coupon_type !== "free_shipping" && (
                  <div className="grid gap-2">
                    <Label htmlFor="discount_value" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Discount Value {formData.coupon_type === "percentage" ? "(%)" : "(KES)"}
                    </Label>
                    <Input
                      id="discount_value"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={formData.coupon_type === "percentage" ? "15" : "1500"}
                      value={formData.discount_value}
                      onChange={(e) => handleChange("discount_value", e.target.value)}
                      required
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="discount_scope" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discount Scope</Label>
                  <Select
                    value={formData.discount_scope}
                    onValueChange={(value) => handleChange("discount_scope", value)}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="all_products" className="hover:bg-secondary focus:bg-secondary text-foreground">All Products</SelectItem>
                      <SelectItem value="specific_categories" className="hover:bg-secondary focus:bg-secondary text-foreground">Specific Categories</SelectItem>
                      <SelectItem value="specific_products" className="hover:bg-secondary focus:bg-secondary text-foreground">Specific Products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Constraints and Parameters */}
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Validity & Restrictions</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Control coupon status and constraints.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="is_active" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select
                    value={formData.is_active ? "true" : "false"}
                    onValueChange={(value) => handleChange("is_active", value === "true")}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="true" className="hover:bg-secondary focus:bg-secondary text-foreground">Active</SelectItem>
                      <SelectItem value="false" className="hover:bg-secondary focus:bg-secondary text-foreground">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="valid_from" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valid From *</Label>
                    <Input
                      id="valid_from"
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => handleChange("valid_from", e.target.value)}
                      required
                      className="bg-background border-border text-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="valid_until" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valid Until</Label>
                    <Input
                      id="valid_until"
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => handleChange("valid_until", e.target.value)}
                      min={formData.valid_from}
                      className="bg-background border-border text-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="min_order_value" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Minimum Order Value (KES)</Label>
                  <Input
                    id="min_order_value"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="No minimum limit"
                    value={formData.min_order_value}
                    onChange={(e) => handleChange("min_order_value", e.target.value)}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max_discount_amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max Discount Amount (KES)</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="No upper bound"
                    value={formData.max_discount_amount}
                    onChange={(e) => handleChange("max_discount_amount", e.target.value)}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="global_usage_limit" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Usage Limit</Label>
                  <Input
                    id="global_usage_limit"
                    type="number"
                    min="1"
                    placeholder="Unlimited usage"
                    value={formData.global_usage_limit}
                    onChange={(e) => handleChange("global_usage_limit", e.target.value)}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Scope Restricted selection: Categories */}
            {formData.discount_scope === "specific_categories" && (
              <Card className="md:col-span-2 border-border bg-card">
                <CardHeader className="border-b border-border/40 pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">Select Categories</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">This coupon will apply only to items in the checked categories.</CardDescription>
                  <div className="relative mt-3">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1 pr-2">
                    {filteredCategories.map((category: any) => {
                      const isChecked = selectedCategories.includes(category.id);
                      return (
                        <label
                          key={category.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-secondary/40 transition-all duration-150 select-none ${
                            isChecked
                              ? "border-primary bg-primary/10 text-foreground font-semibold"
                              : "border-border/50 bg-background/50 text-muted-foreground hover:border-border"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0 focus:ring-2 h-4 w-4 cursor-pointer"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories(prev => [...prev, category.id]);
                              } else {
                                setSelectedCategories(prev => prev.filter(id => id !== category.id));
                              }
                            }}
                          />
                          <span className="text-sm font-semibold truncate">{category.name}</span>
                        </label>
                      );
                    })}
                    {filteredCategories.length === 0 && (
                      <div className="col-span-full py-6 text-center text-xs text-muted-foreground">No categories found matching your search.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scope Restricted selection: Products */}
            {formData.discount_scope === "specific_products" && (
              <Card className="md:col-span-2 border-border bg-card">
                <CardHeader className="border-b border-border/40 pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">Select Products</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">This coupon will apply only to the selected product models.</CardDescription>
                  <div className="relative mt-3">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search products by name or SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1 pr-2">
                    {filteredProducts.map((product: any) => {
                      const isChecked = selectedProducts.includes(product.id);
                      return (
                        <label
                          key={product.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-secondary/40 transition-all duration-150 select-none ${
                            isChecked
                              ? "border-primary bg-primary/10 text-foreground font-semibold"
                              : "border-border/50 bg-background/50 text-muted-foreground hover:border-border"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0 focus:ring-2 h-4 w-4 cursor-pointer"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts(prev => [...prev, product.id]);
                              } else {
                                setSelectedProducts(prev => prev.filter(id => id !== product.id));
                              }
                            }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold truncate text-foreground">{product.name}</span>
                            {product.sku && <span className="text-[10px] uppercase font-mono text-muted-foreground">SKU: {product.sku}</span>}
                          </div>
                        </label>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <div className="col-span-full py-6 text-center text-xs text-muted-foreground">No products found matching your search.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end gap-4 border-t border-border/40 pt-4">
            <Button
              variant="outline"
              type="button"
              asChild
              className="bg-background border-border hover:bg-secondary text-foreground rounded-lg h-9 font-medium"
            >
              <Link href="/dashboard/shopping/coupons">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground border-none rounded-lg h-9 font-medium shadow-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
