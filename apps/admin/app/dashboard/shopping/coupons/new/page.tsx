"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
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
import { shoppingService } from "@mymeddevices/shared-core";
import Link from "next/link";

export default function NewCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await shoppingService.createCoupon({
        code: formData.code.toUpperCase(),
        description: formData.description,
        coupon_type: formData.coupon_type,
        discount_value: parseFloat(formData.discount_value),
        discount_scope: formData.discount_scope,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        // Backend expects these fields at root level, not nested in restrictions
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : undefined,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : undefined,
        global_usage_limit: formData.global_usage_limit ? parseInt(formData.global_usage_limit) : undefined,
      });

      toast.success("Coupon created successfully");
      router.push("/dashboard/shopping/coupons");
    } catch (error) {
      console.error("Failed to create coupon", error);
      toast.error("Failed to create coupon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Create Coupon</h1>
            <p className="text-muted-foreground">
              Create a new promotional discount code.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Set up the coupon code and description.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
                    placeholder="SUMMER2024"
                    value={formData.code}
                    onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
                    required
                    className="uppercase"
                  />
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

            {/* Discount Type */}
            <Card>
              <CardHeader>
                <CardTitle>Discount Type</CardTitle>
                <CardDescription>Configure the discount structure.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="coupon_type">Coupon Type *</Label>
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
                      Discount Value * {formData.coupon_type === "percentage" ? "(%)" : "(KES)"}
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
                  <Label htmlFor="discount_scope">Discount Scope *</Label>
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

            {/* Validity & Restrictions */}
            <Card>
              <CardHeader>
                <CardTitle>Validity & Restrictions</CardTitle>
                <CardDescription>Set time limits and usage restrictions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="valid_from">Valid From *</Label>
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
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Creating..." : "Create Coupon"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
