'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Loader2,
  Package,
  FileText
} from 'lucide-react';
import { useOrder } from '@/lib/api/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderStatusBadge } from '@/components/vendor/orders/OrderStatusBadge';

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: order, loading, error } = useOrder(id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/vendor/orders">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Link>
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <h2 className="font-semibold">Failed to load order details</h2>
          <p className="text-sm">The order may not exist or you may not have permission to view it.</p>
        </div>
      </div>
    );
  }

  const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vendor/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Order {order.order_number}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
              <Calendar className="h-4 w-4" /> Placed on {orderDate}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg h-10 w-10 flex items-center justify-center shrink-0 text-slate-500">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{item.product_name}</h4>
                        <p className="text-xs text-slate-400">SKU: {item.sku}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatCurrency(item.unit_price)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(item.total)}</p>
                      <span className="inline-block mt-1">
                        <OrderStatusBadge status={item.status || order.status} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Summary & Details */}
        <div className="space-y-6">
          {/* Order Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Order Number</span>
                <span className="font-semibold">{order.order_number}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Order Date</span>
                <span className="font-medium">{orderDate}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Order Status</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Items</span>
                  <span className="font-semibold">{order.item_count}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Your Earnings</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(order.vendor_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle>Order History & Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative border-l border-slate-100 dark:border-slate-800 pl-4 ml-2 space-y-4">
                {order.timeline?.map((evt, idx) => (
                  <div key={evt.id || idx} className="relative">
                    <span className="absolute -left-[21px] top-1 bg-white dark:bg-slate-950 rounded-full border border-emerald-500 p-0.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{evt.message}</p>
                      <p className="text-[10px] text-slate-400">
                        {evt.created_at ? new Date(evt.created_at).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Notes Card */}
          {order.customer_notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Customer Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-2.5 rounded border border-slate-100 dark:border-slate-800">
                  {order.customer_notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
