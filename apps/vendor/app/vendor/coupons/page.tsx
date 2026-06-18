'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag, Plus, Copy, Trash2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { vendorCouponsApi } from '@/lib/api/endpoints/coupons';

export default function VendorCouponsPage() {
  const queryClient = useQueryClient();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['vendor-coupons'],
    queryFn: () => vendorCouponsApi.getCoupons(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorCouponsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-coupons'] });
      toast.success('Coupon deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const getDiscountLabel = (coupon: { coupon_type: string; discount_value: number }) => {
    switch (coupon.coupon_type) {
      case 'percentage': return `${coupon.discount_value}% OFF`;
      case 'fixed_amount': return `KES ${coupon.discount_value.toLocaleString()} OFF`;
      case 'free_shipping': return 'Free Shipping';
      default: return `${coupon.discount_value}`;
    }
  };

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Coupons</h1>
          <p className="text-muted-foreground mt-1">Create and manage promotional coupons</p>
        </div>
        <Button asChild>
          <Link href="/vendor/coupons/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>
      ) : !coupons || coupons.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No coupons yet</p>
            <Button asChild className="mt-4">
              <Link href="/vendor/coupons/new">Create Your First Coupon</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Array.isArray(coupons) ? coupons : []).map((coupon) => {
            const expired = isExpired(coupon.valid_until);
            return (
              <Card key={coupon.id} className={expired ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="outline" className="font-mono">{coupon.code}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Used {coupon.usage_count} times
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{getDiscountLabel(coupon)}</Badge>
                    </div>
                  </div>
                  {coupon.description && (
                    <p className="text-sm text-muted-foreground">{coupon.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {coupon.valid_until ? (
                        expired ? 'Expired' : `Expires ${new Date(coupon.valid_until).toLocaleDateString()}`
                      ) : 'No expiry'}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        if (confirm('Delete this coupon?')) {
                          deleteMutation.mutate(coupon.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
