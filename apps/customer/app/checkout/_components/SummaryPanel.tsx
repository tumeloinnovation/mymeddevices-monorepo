"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Tag, X, Coins } from "lucide-react";
import { formatCurrency } from "@/lib/utils/utils";
import { customerLoyaltyApi, LoyaltySummary } from "@/lib/api/endpoints/loyalty";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function SummaryPanel({
  subtotal,
  shipping,
  packagingFee,
  servicesFee,
  tax = 0,
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
  appliedCoupon,
  pointsToRedeem = 0,
  setPointsToRedeem,
  isAuthenticated,
  orderNotes = '',
  setOrderNotes,
  isAddingNotes = false,
}: any) {
  const [loyaltySummary, setLoyaltySummary] = React.useState<LoyaltySummary | null>(null);
  const [loadingLoyalty, setLoadingLoyalty] = React.useState(false);
  const [useLoyalty, setUseLoyalty] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      setLoadingLoyalty(true);
      customerLoyaltyApi.getSummary()
        .then(summary => setLoyaltySummary(summary))
        .catch(err => console.error("Failed to fetch loyalty", err))
        .finally(() => setLoadingLoyalty(false));
    }
  }, [isAuthenticated]);

  const maxPoints = loyaltySummary?.total_points || 0;
  
  // Handle turning toggle on/off
  React.useEffect(() => {
    if (useLoyalty && maxPoints > 0) {
      if (setPointsToRedeem) setPointsToRedeem(maxPoints);
    } else {
      if (setPointsToRedeem) setPointsToRedeem(0);
    }
  }, [useLoyalty, maxPoints, setPointsToRedeem]);

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value || "0", 10);
    if (isNaN(val)) val = 0;
    if (val > maxPoints) val = maxPoints;
    if (val < 0) val = 0;
    if (setPointsToRedeem) setPointsToRedeem(val);
  };

  const discountAmount = appliedCoupon?.discount_amount || 0;
  const pointsDiscountAmount = Math.floor(pointsToRedeem / 2);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount - pointsDiscountAmount);
  const finalTotal = total !== undefined ? total : Math.max(0, discountedSubtotal + shipping + packagingFee + servicesFee + tax);

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
          <div className="flex justify-between">
            <span>VAT (16%)</span>
            <span className="font-medium">Ksh. {formatCurrency(tax)}</span>
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

          {pointsDiscountAmount > 0 && (
            <div className="flex justify-between text-amber-600 font-medium">
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3" />
                Points Redeemed ({pointsToRedeem})
              </span>
              <span>- Ksh. {formatCurrency(pointsDiscountAmount)}</span>
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

        {/* Loyalty Points Input */}
        {isAuthenticated && (
          <div className="pt-2 border-t flex flex-col gap-3">
            {loadingLoyalty ? (
              <div className="flex items-center gap-2 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Loading loyalty points...</span>
              </div>
            ) : maxPoints > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="use-loyalty" 
                    checked={useLoyalty} 
                    onCheckedChange={(c) => setUseLoyalty(!!c)} 
                  />
                  <label htmlFor="use-loyalty" className="text-sm font-medium leading-none cursor-pointer">
                    Apply Loyalty Points
                  </label>
                </div>
                
                {useLoyalty && (
                  <div className="flex flex-col gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
                    <div className="text-xs text-amber-700 dark:text-amber-400">
                      You have {maxPoints} points
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="number"
                        min={0}
                        max={maxPoints}
                        value={pointsToRedeem || ""}
                        onChange={handlePointsChange}
                        className="h-8 text-xs"
                      />
                      <div className="text-xs text-nowrap font-medium text-amber-700 dark:text-amber-400">
                        = Ksh. {formatCurrency(pointsDiscountAmount)} discount
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        <div className="border-t pt-3 flex justify-between items-center text-base font-semibold text-foreground">
          <span>Total</span>
          <span>Ksh. {formatCurrency(finalTotal)}</span>
        </div>

        {/* Order Notes Section */}
        <div className="pt-3 border-t space-y-2">
          <Label htmlFor="order-notes" className="text-sm font-medium">
            Order Notes (optional)
          </Label>
          <Textarea
            id="order-notes"
            placeholder="Add any special instructions for your order..."
            value={orderNotes}
            onChange={(e) => setOrderNotes?.(e.target.value)}
            disabled={isPending}
            rows={3}
            className="resize-none text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Any special requests or delivery instructions
          </p>
        </div>

        <div className="space-y-2">
          {isShippingCalculating ? (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Calculating shipping fees...</span>
            </div>
          ) : disabled ? (
            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={onCheckout} disabled={true}>
                {isPending ? "Placing..." : "Place Order"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Please complete all required fields above
              </p>
            </div>
          ) : (
            <Button className="w-full" onClick={onCheckout} disabled={isPending}>
              {isPending ? "Placing..." : "Place Order"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
