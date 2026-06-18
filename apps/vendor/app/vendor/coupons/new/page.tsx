'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { vendorCouponsApi } from '@/lib/api/endpoints/coupons';

export default function NewVendorCouponPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    coupon_type: 'percentage',
    discount_value: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
  });

  const createMutation = useMutation({
    mutationFn: () => vendorCouponsApi.create({
      code: formData.code.toUpperCase(),
      description: formData.description || undefined,
      coupon_type: formData.coupon_type,
      discount_value: formData.discount_value,
      valid_from: new Date(formData.valid_from).toISOString(),
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : undefined,
    }),
    onSuccess: () => {
      toast.success('Coupon created');
      router.push('/vendor/coupons');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    if (!formData.discount_value || formData.discount_value <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendor/coupons">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Coupon</h1>
          <p className="text-muted-foreground mt-1">Create a new promotional coupon</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Coupon Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g. SUMMER20"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon_type">Discount Type</Label>
                <Select value={formData.coupon_type} onValueChange={(v) => setFormData(prev => ({ ...prev, coupon_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the coupon offer"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_value">
                Discount Value {formData.coupon_type === 'percentage' ? '(%)' : '(KES)'}
              </Label>
              <Input
                id="discount_value"
                type="number"
                min={1}
                placeholder={formData.coupon_type === 'percentage' ? '10' : '500'}
                value={formData.discount_value || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, discount_value: Number(e.target.value) }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until (optional)</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button variant="outline" asChild>
                <Link href="/vendor/coupons">Cancel</Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Create Coupon</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
