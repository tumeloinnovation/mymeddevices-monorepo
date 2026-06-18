"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Tag, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils/utils";

export default function SummaryPanel({ 
  subtotal, 
  shipping, 
  packagingFee, 
  servicesFee, 
  total, 
  onCheckout, 
  isPending, 
  disabled, 
  isShippingCalculating = false, 
  shippingCalculated = true,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  handleRemoveCoupon,
  isApplyingCoupon,
  appliedCoupon
}: any) {
  const discountAmount = appliedCoupon?.discount_amount || 0;
  const finalTotal = total - discountAmount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium">Ksh. {formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="font-medium">Ksh. {formatCurrency(shipping)}</span>
          </div>
          <div className="flex justify-between">
            <span>Packaging Fee</span>
            <span className="font-medium">Ksh. {formatCurrency(packagingFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Services Fee</span>
            <span className="font-medium">Ksh. {formatCurrency(servicesFee)}</span>
          </div>
          
          {appliedCoupon && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Discount ({appliedCoupon.code})
              </span>
              <span>- Ksh. {formatCurrency(discountAmount)}</span>
            </div>
          )}
        </div>

        {/* Coupon Input */}
        <div className="pt-2 border-t">
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">{appliedCoupon.code}</span>
              </div>
              <button 
                onClick={handleRemoveCoupon}
                className="text-emerald-600 hover:text-emerald-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input 
                placeholder="Coupon code" 
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="h-9 text-xs"
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-3"
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon || !couponCode.trim()}
              >
                {isApplyingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
              </Button>
            </div>
          )}
        </div>

        <div className="border-t pt-3 flex justify-between items-center text-base font-semibold text-foreground">
          <span>Total</span>
          <span>Ksh. {formatCurrency(finalTotal)}</span>
        </div>

        <div className="space-y-2">
          {isShippingCalculating ? (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Calculating shipping fees...</span>
            </div>
          ) : !shippingCalculated ? (
            <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
              <span>Please select a delivery address to calculate shipping.</span>
            </div>
          ) : (
            <Button className="w-full" onClick={onCheckout} disabled={disabled || isPending}>
              {isPending ? "Placing..." : "Place Order"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
