'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard,
  Truck, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Package
} from 'lucide-react';
import { useOrder } from '@/lib/api/hooks/useOrders';
import { ordersApi } from '@/lib/api/endpoints/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderStatusBadge } from '@/components/vendor/orders/OrderStatusBadge';
import type { OrderStatus } from '@/lib/api/types';

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: order, loading, error, refetch } = useOrder(id);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<OrderStatus | ''>('');
  
  // Tracking inputs
  const [carrier, setCarrier] = useState('G4S');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingItemId, setTrackingItemId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleStatusChange = async (itemId: string, newStatus: OrderStatus) => {
    setUpdatingItemId(itemId);
    setActionError(null);
    try {
      const success = await ordersApi.updateOrderStatus(id, itemId, newStatus);
      if (success) {
        await refetch();
      } else {
        setActionError('Failed to update status on server');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error updating item status');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleAddTracking = async (itemId: string) => {
    if (!trackingNumber) {
      setActionError('Tracking number is required');
      return;
    }
    setTrackingItemId(itemId);
    setActionError(null);
    try {
      const success = await ordersApi.addTrackingInfo(id, itemId, {
        carrier,
        tracking_number: trackingNumber
      });
      if (success) {
        setTrackingNumber('');
        await refetch();
      } else {
        setActionError('Failed to save tracking info');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error saving tracking info');
    } finally {
      setTrackingItemId(null);
    }
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

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {actionError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left 2 Columns: Items & Actions */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-4">
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

                  {/* Fulfillment actions */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fulfill & Update Status</h5>
                      <p className="text-[11px] text-slate-400">Update item status or add shipping tracking number</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        defaultValue={item.status || order.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as OrderStatus)}
                        disabled={updatingItemId === item.id}
                        className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      {updatingItemId === item.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                      )}
                    </div>
                  </div>

                  {/* Tracking input if status is processing/packed/shipped and no tracking number assigned yet */}
                  {(!item.tracking_number) ? (
                    <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-lg space-y-2.5">
                      <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5" /> Add Shipping & Tracking Details
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-slate-400">Carrier</label>
                          <Input
                            placeholder="e.g. G4S, DHL"
                            size={28}
                            className="h-8 text-xs"
                            value={carrier}
                            onChange={(e) => setCarrier(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-slate-400">Tracking Number</label>
                          <Input
                            placeholder="Tracking #"
                            className="h-8 text-xs"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={trackingItemId === item.id}
                          onClick={() => handleAddTracking(item.id)}
                        >
                          {trackingItemId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          Save Tracking
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 p-2.5 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-emerald-600" />
                        Shipped via <strong>{carrier || 'Courier'}</strong>: <code>{item.tracking_number}</code>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] text-slate-500 hover:text-slate-800"
                        onClick={() => {
                          setCarrier(carrier);
                          setTrackingNumber(item.tracking_number || '');
                        }}
                      >
                        Edit Info
                      </Button>
                    </div>
                  )}
                </div>
              ))}
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
        </div>

        {/* Right Column: Customer & Delivery Details */}
        <div className="space-y-6">
          {/* Customer Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div>
                <p className="text-sm font-semibold">{order.customer_name}</p>
                <span className="text-xs text-slate-400">Buyer</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="truncate">{order.customer_email}</span>
              </div>
              {order.shipping_address?.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{order.shipping_address.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {order.shipping_address?.first_name} {order.shipping_address?.last_name}
              </p>
              <p>{order.shipping_address?.line1}</p>
              {order.shipping_address?.line2 && <p>{order.shipping_address.line2}</p>}
              <p>
                {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}
              </p>
              <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-2 block">
                {order.shipping_address?.country}
              </p>
            </CardContent>
          </Card>

          {/* Payment Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payment & Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Method</span>
                <span className="font-medium flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5 text-slate-400" /> {order.payment_method || 'M-Pesa'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status</span>
                <span className="font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded">
                  {order.payment_status || 'Paid'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
