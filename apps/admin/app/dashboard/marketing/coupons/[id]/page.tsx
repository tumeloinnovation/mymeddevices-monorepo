"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Tag, Percent } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function EditMarketingCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    coupon_type: "percentage",
    discount_value: "",
    discount_scope: "all_products",
    valid_from: "",
    valid_until: "",
    min_order_value: "",
    max_discount_amount: "",
    global_usage_limit: "",
    is_active: true,
  });

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const data: any = await shoppingService.getCoupon(resolvedParams.id);
        if (data) {
          setFormData({
            code: data.code || "",
            description: data.description || "",
            coupon_type: data.coupon_type || "percentage",
            discount_value: data.discount_value ? String(data.discount_value) : "",
            discount_scope: data.discount_scope || "all_products",
            valid_from: data.valid_from ? new Date(data.valid_from).toISOString().split('T')[0] : "",
            valid_until: data.valid_until ? new Date(data.valid_until).toISOString().split('T')[0] : "",
            min_order_value: data.min_order_value ? String(data.min_order_value) : "",
            max_discount_amount: data.max_discount_amount ? String(data.max_discount_amount) : "",
            global_usage_limit: data.global_usage_limit ? String(data.global_usage_limit) : "",
            is_active: data.is_active ?? true,
          });
        }
      } catch (error) {
        toast.error("Failed to load coupon details");
      } finally {
        setFetching(false);
      }
    };
    fetchCoupon();
  }, [resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
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
        is_active: formData.is_active,
      };

      await shoppingService.updateCoupon(resolvedParams.id, payload);
      toast.success("Coupon updated successfully!");
      router.push("/dashboard/marketing/coupons");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update coupon");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl mx-auto p-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

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
            <h1 className="text-2xl font-bold tracking-tight">Edit Coupon: {formData.code}</h1>
            <p className="text-sm text-muted-foreground">Modify promotional discount settings.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" /> Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
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
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_discount_amount">Cap Max Discount (KSh)</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/marketing/coupons">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
