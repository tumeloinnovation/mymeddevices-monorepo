"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DeliveryAddressSheet from "@/components/maps/DeliveryAddressSheet";
import { Loader2 } from "lucide-react";

export default function DeliverySection({
  delivery,
  onSelect,
  savedAddresses,
  shippingLoading = false,
  onCalculateShipping,
  calculateRequested = false,
}: any) {
  return (
    <Card className="bg-card">
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium pt-2 my-2 flex items-center justify-between">
              <span>Select Delivery Address</span>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                {shippingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4" />
                    <span>Calculating shipping…</span>
                  </>
                ) : calculateRequested ? (
                  <span className="text-success">Shipping fetched</span>
                ) : null}
              </div>
            </div>

            <DeliveryAddressSheet
              delivery={delivery}
              onSelect={onSelect}
            >
              <Button variant="outline" className="w-full">
                {delivery ? "Change Address" : "Select Address"}
              </Button>
            </DeliveryAddressSheet>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Selected address</div>
            <div className="mt-2">
              <div className="p-3 rounded-md border bg-background">
                {delivery ? (
                  <div>
                    <div className="font-medium">{delivery.address}</div>
                    <div className="text-xs text-muted-foreground mt-1">{delivery.region}</div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onCalculateShipping && onCalculateShipping()}
                        disabled={shippingLoading}
                      >
                        {shippingLoading ? (
                          <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Calculating</span>
                        ) : (
                          "Calculate shipping"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No address selected</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
