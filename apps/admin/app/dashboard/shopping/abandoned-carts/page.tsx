"use client";

import { useState, useEffect } from "react";
import { Search, Mail, Eye, Clock, Loader2 } from "lucide-react";
import { shoppingService, AbandonedCart } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState<string | null>(null);
  const [selectedCart, setSelectedCart] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadCarts();
  }, []);

  const loadCarts = async () => {
    setLoading(true);
    try {
      const data = await shoppingService.getAbandonedCarts();
      setCarts(data);
    } catch (error) {
      console.error("Failed to load abandoned carts", error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (cart: AbandonedCart) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const response = await shoppingService.getAbandonedCartDetail(cart.id);
      const detail = (response as any).data ?? response;
      setSelectedCart(detail);
    } catch (error) {
      console.error("Failed to load cart details", error);
      toast.error("Failed to load cart details");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRecover = async (cartId: string) => {
    setRecovering(cartId);
    try {
      await shoppingService.recoverAbandonedCart(cartId);
      toast.success("Recovery email queued for this cart");
      loadCarts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to queue recovery");
    } finally {
      setRecovering(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abandoned Carts</h1>
          <p className="text-muted-foreground">
            View and recover carts that customers have left behind.
          </p>
        </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer..."
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cart ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : carts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No abandoned carts found.
                </TableCell>
              </TableRow>
            ) : (
              carts.map((cart) => (
                <TableRow key={cart.id}>
                  <TableCell className="font-mono text-xs">{cart.id.substring(0, 8)}...</TableCell>
                  <TableCell className="font-mono text-xs">{cart.user_id.substring(0, 8)}...</TableCell>
                  <TableCell>{cart.items.length} items</TableCell>
                  <TableCell>{new Date(cart.updated_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">Abandoned</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(cart)}>
                        <Eye className="mr-2 h-3 w-3" /> View
                      </Button>
                      <Button size="sm" onClick={() => handleRecover(cart.id)} disabled={recovering === cart.id}>
                        {recovering === cart.id ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-3 w-3" />
                        )}
                        Recover
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Abandoned Cart Details</DialogTitle>
            <DialogDescription>
              Items left behind by the customer.
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : selectedCart ? (
            <div className="space-y-4">
              <div className="text-sm">
                <span className="font-medium">Cart ID:</span>{" "}
                <code className="font-mono">{selectedCart.id}</code>
              </div>
              <div className="text-sm">
                <span className="font-medium">User ID:</span>{" "}
                <code className="font-mono">{selectedCart.user_id || "Guest"}</code>
              </div>
              <div className="text-sm">
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date(selectedCart.updated_at).toLocaleString()}
              </div>
              <div className="border rounded-lg divide-y">
                {selectedCart.items?.length > 0 ? (
                  selectedCart.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium">
                          {item.product?.name || `Product ID: ${item.product_id?.substring(0, 8)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × KES {parseFloat(item.unit_price || item.product?.price || 0).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        KES {(item.quantity * parseFloat(item.unit_price || item.product?.price || 0)).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-sm text-muted-foreground">No items in cart.</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleRecover(selectedCart.id)} disabled={recovering === selectedCart.id}>
                  {recovering === selectedCart.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send Recovery Email
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
