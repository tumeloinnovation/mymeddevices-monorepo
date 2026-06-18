"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/utils";

export default function MobileBottomSummary({ subtotal, shipping, total, onOpenSummary, onCheckout, isPending, disabled, isShippingCalculating = false }: any) {
  return (
    <div className="lg:hidden fixed left-0 right-0 bottom-4 px-4">
      <div className="max-w-3xl mx-auto bg-transparent">
        <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-xl shadow-lg">
          <div>
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="font-medium">Ksh. {formatCurrency(total)}</div>
          </div>
          <div className="flex gap-2">
            {isShippingCalculating ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Calculating...</span>
              </div>
            ) : (
              <>
                <Button variant="outline" onClick={onOpenSummary}>Review</Button>
                <Button onClick={onCheckout} disabled={disabled || isPending}>
                  {isPending ? "Placing..." : "Pay"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
