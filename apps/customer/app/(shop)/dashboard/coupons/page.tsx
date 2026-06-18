'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, Copy, Check, Calendar, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { customerCouponsApi } from '@/lib/api/endpoints/coupons';
import { formatCurrency } from '@/lib/utils/utils';

export default function CouponsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['customer-coupons'],
    queryFn: () => customerCouponsApi.getAvailable(),
  });

  const { data: usageData } = useQuery({
    queryKey: ['my-coupon-usage'],
    queryFn: () => customerCouponsApi.getMyCoupons(),
  });

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Coupon code copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDiscountLabel = (coupon: { coupon_type: string; discount_value: number }) => {
    switch (coupon.coupon_type) {
      case 'percentage': return `${coupon.discount_value}% OFF`;
      case 'fixed_amount': return `KES ${formatCurrency(coupon.discount_value)} OFF`;
      case 'free_shipping': return 'Free Shipping';
      case 'bogo': return 'BOGO';
      default: return `${coupon.discount_value}`;
    }
  };

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Coupons</h1>
        <p className="text-muted-foreground mt-1">Available coupons and your usage history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : !coupons || coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No coupons available right now</p>
              <p className="text-sm mt-1">Check back later for promotions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Array.isArray(coupons) ? coupons : []).map((coupon) => {
                const expired = isExpired(coupon.valid_until);
                return (
                  <Card key={coupon.id} className={`relative overflow-hidden ${expired ? 'opacity-60' : 'border-primary/20'}`}>
                    <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full bg-primary/5" />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                            {coupon.code}
                          </Badge>
                        </div>
                        <Badge className={expired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                          {expired ? 'Expired' : getDiscountLabel(coupon)}
                        </Badge>
                      </div>
                      {coupon.description && (
                        <p className="text-sm text-muted-foreground mt-2">{coupon.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        {coupon.valid_until && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expires {new Date(coupon.valid_until).toLocaleDateString()}
                          </span>
                        )}
                        {coupon.restrictions?.min_order_value && Number(coupon.restrictions.min_order_value) > 0 && (
                          <span>
                            Min: KES {formatCurrency(Number(coupon.restrictions.min_order_value))}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={copiedId === coupon.id ? 'default' : 'secondary'}
                        className="mt-3 w-full gap-2"
                        onClick={() => copyCode(coupon.code, coupon.id)}
                        disabled={expired}
                      >
                        {copiedId === coupon.id ? (
                          <><Check className="h-4 w-4" /> Copied!</>
                        ) : (
                          <><Copy className="h-4 w-4" /> Copy Code</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {usageData && usageData.items && usageData.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usageData.items.map((usage) => (
                <div key={usage.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Coupon #{usage.coupon_id.slice(0, 8)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">-KES {formatCurrency(usage.discount_amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(usage.used_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
