"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
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
import { shoppingService, Coupon } from "@mymeddevices/shared-core";
import Link from "next/link";

export default function EditCouponPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 col-span-2" />
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/shopping/coupons">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Coupon</h1>
            <p className="text-muted-foreground">
              Update promotional discount code.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update the coupon code and description.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Coupon Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    disabled
                    className="uppercase bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Code cannot be changed after creation.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Summer sale discount..."
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Discount Type</CardTitle>
                <CardDescription>Configure the discount structure.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="coupon_type">Coupon Type</Label>
                  <Select
                    value={formData.coupon_type}
                    onValueChange={(value) => handleChange("coupon_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Discount</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount Discount</SelectItem>
                      <SelectItem value="free_shipping">Free Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.coupon_type !== "free_shipping" && (
                  <div className="grid gap-2">
                    <Label htmlFor="discount_value">
                      Discount Value {formData.coupon_type === "percentage" ? "(%)" : "(KES)"}
                    </Label>
                    <Input
                      id="discount_value"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={formData.coupon_type === "percentage" ? "10" : "1000"}
                      value={formData.discount_value}
                      onChange={(e) => handleChange("discount_value", e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="discount_scope">Discount Scope</Label>
                  <Select
                    value={formData.discount_scope}
                    onValueChange={(value) => handleChange("discount_scope", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_products">All Products</SelectItem>
                      <SelectItem value="specific_categories">Specific Categories</SelectItem>
                      <SelectItem value="specific_products">Specific Products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Validity & Restrictions</CardTitle>
                <CardDescription>Set time limits and usage restrictions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="is_active">Status</Label>
                  <Select
                    value={formData.is_active ? "true" : "false"}
                    onValueChange={(value) => handleChange("is_active", value === "true")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => handleChange("valid_from", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => handleChange("valid_until", e.target.value)}
                    min={formData.valid_from}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="min_order_value">Minimum Order Value (KES)</Label>
                  <Input
                    id="min_order_value"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1000"
                    value={formData.min_order_value}
                    onChange={(e) => handleChange("min_order_value", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max_discount_amount">Max Discount Amount (KES)</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5000"
                    value={formData.max_discount_amount}
                    onChange={(e) => handleChange("max_discount_amount", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="global_usage_limit">Usage Limit</Label>
                  <Input
                    id="global_usage_limit"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={formData.global_usage_limit}
                    onChange={(e) => handleChange("global_usage_limit", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for unlimited usage</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" type="button" asChild>
              <Link href="/dashboard/shopping/coupons">Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
