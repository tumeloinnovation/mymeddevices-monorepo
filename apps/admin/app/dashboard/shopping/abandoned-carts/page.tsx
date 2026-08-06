"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Mail,
  Eye,
  Clock,
  Loader2,
  ShoppingCart,
  User,
  Package,
  Calendar,
  RefreshCw,
  Copy,
} from "lucide-react";
import { shoppingService, AbandonedCart } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import Link from "next/link";
import {
  Card,
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState<string | null>(null);
  const [selectedCart, setSelectedCart] = useState<any>(null);
  const [selectedCartMeta, setSelectedCartMeta] = useState<AbandonedCart | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCarts();
  }, []);

  const loadCarts = async () => {
    setLoading(true);
    try {
      const data = await shoppingService.getAbandonedCarts();
      setCarts(data || []);
    } catch (error) {
      console.error("Failed to load abandoned carts", error);
      toast.error("Failed to fetch abandoned carts");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (cart: AbandonedCart) => {
    setSelectedCartMeta(cart);
    setSelectedCart(null);
    setDetailLoading(true);
    setSheetOpen(true);
    try {
      const response = await shoppingService.getAbandonedCartDetail(cart.id);
      const detail = (response as any).data ?? response;
      setSelectedCart(detail);
    } catch (error) {
      console.error("Failed to load cart details", error);
      toast.error("Failed to load cart details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRecover = async (cartId: string) => {
    setRecovering(cartId);
    try {
      await shoppingService.recoverAbandonedCart(cartId);
      toast.success("Recovery notification queued for this cart");
      loadCarts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to queue recovery");
    } finally {
      setRecovering(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const filteredCarts = carts.filter(
    (c) =>
      c.id?.toLowerCase().includes(search.toLowerCase()) ||
      (c as any).user_id?.toLowerCase().includes(search.toLowerCase()) ||
      (c as any).cart_token?.toLowerCase().includes(search.toLowerCase())
  );

  const calculateCartTotal = (cart: any) => {
    if (!cart?.items || cart.items.length === 0) return 0;
    return cart.items.reduce((sum: number, item: any) => {
      const price = parseFloat(item.unit_price || item.product?.price || 0);
      return sum + (item.quantity * price);
    }, 0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Abandoned Carts
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Inspect uncompleted customer carts, analyze abandoned items, and dispatch recovery notifications.
            </p>
          </div>
          <Button onClick={loadCarts} variant="outline" size="sm" disabled={loading} className="gap-2 self-start sm:self-auto">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh List
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Cart ID, User ID, or Token..."
              className="pl-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Card className="border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cart Reference</TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead>Items Count</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredCarts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                    No abandoned carts matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCarts.map((cart: any) => (
                  <TableRow key={cart.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs">
                      <div className="font-semibold text-foreground">#{cart.id?.substring(0, 8)}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{cart.id}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {cart.user_id ? (
                        <Badge variant="secondary" className="gap-1 font-normal text-[11px]">
                          <User className="h-3 w-3" /> Registered
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 font-normal text-[11px] bg-muted/30">
                          Guest User
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {cart.items?.length || cart.item_count || 0} item(s)
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        {new Date(cart.updated_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 text-[10px]">
                        Abandoned
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1">
                          <Link href={`/dashboard/shopping/abandoned-carts/${cart.id}`}>
                            <Eye className="h-3.5 w-3.5 text-primary" /> Inspect Details
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRecover(cart.id)}
                          disabled={recovering === cart.id}
                          className="h-8 text-xs gap-1"
                        >
                          {recovering === cart.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Mail className="h-3.5 w-3.5" />
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

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="sm:max-w-xl w-full p-0 flex flex-col h-full overflow-hidden">
            <SheetHeader className="p-6 pb-4 border-b bg-card">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold uppercase">
                  Abandoned Cart
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  ID: #{selectedCartMeta?.id?.substring(0, 8)}
                </span>
              </div>
              <SheetTitle className="text-xl font-bold tracking-tight mt-1 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Cart Inspection & Recovery Sheet
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Detailed breakdown of products, user credentials, timing metrics, and total value left behind.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="space-y-4 py-6">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : selectedCart ? (
                <>
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-muted/40 rounded-xl border text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1">
                        <User className="h-3 w-3 text-primary" /> Customer Reference
                      </div>
                      <div className="font-mono text-xs font-semibold truncate">
                        {selectedCart.user_id ? selectedCart.user_id : "Guest Session"}
                      </div>
                      {selectedCart.user_id && (
                        <div className="text-[11px] text-primary hover:underline cursor-pointer flex items-center gap-1 mt-0.5" onClick={() => copyToClipboard(selectedCart.user_id, "User ID")}>
                          Copy User ID <Copy className="h-3 w-3 inline" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-amber-500" /> Inactivity Timestamp
                      </div>
                      <div className="font-semibold text-xs">
                        {new Date(selectedCart.updated_at).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Type: {selectedCart.cart_type || "persistent"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3 border shadow-xs bg-card">
                      <div className="text-[10px] uppercase font-semibold text-muted-foreground">Total Cart Items</div>
                      <div className="text-xl font-bold mt-0.5 flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-primary" />
                        {selectedCart.items?.length || 0}
                      </div>
                    </Card>

                    <Card className="p-3 border shadow-xs bg-primary/5 border-primary/20">
                      <div className="text-[10px] uppercase font-semibold text-primary">Estimated Cart Value</div>
                      <div className="text-xl font-bold mt-0.5 text-primary">
                        KSh {calculateCartTotal(selectedCart).toLocaleString()}
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-primary" />
                      Abandoned Cart Line Items ({selectedCart.items?.length || 0})
                    </h3>

                    <div className="border rounded-xl divide-y bg-card overflow-hidden">
                      {selectedCart.items && selectedCart.items.length > 0 ? (
                        selectedCart.items.map((item: any) => {
                          const unitPrice = parseFloat(item.unit_price || item.product?.price || 0);
                          const lineTotal = item.quantity * unitPrice;
                          const imageSrc = item.product?.images?.[0]?.url || item.product?.image_url;

                          return (
                            <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                {imageSrc ? (
                                  <img src={imageSrc} alt={item.product?.name || "Product"} className="h-10 w-10 rounded-lg object-cover border shrink-0" />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-foreground truncate">
                                    {item.product?.name || `Product #${item.product_id?.substring(0, 8)}`}
                                  </p>
                                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                                    <span>Qty: <strong className="text-foreground">{item.quantity}</strong></span>
                                    <span>•</span>
                                    <span>KSh {unitPrice.toLocaleString()} each</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-foreground">
                                  KSh {lineTotal.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-muted-foreground italic">
                          No items present in this cart object.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border bg-muted/20 space-y-2 text-xs">
                    <div className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                      Internal System Identifiers
                    </div>
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-muted-foreground">Cart UUID:</span>
                      <button onClick={() => copyToClipboard(selectedCart.id, "Cart UUID")} className="hover:text-primary underline flex items-center gap-1">
                        {selectedCart.id} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    {selectedCart.cart_token && (
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-muted-foreground">Cart Token:</span>
                        <button onClick={() => copyToClipboard(selectedCart.cart_token, "Cart Token")} className="hover:text-primary underline flex items-center gap-1">
                          {selectedCart.cart_token} <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Could not load details for the selected cart.
                </div>
              )}
            </div>

            {selectedCart && (
              <SheetFooter className="p-4 border-t bg-card flex flex-row items-center justify-between gap-3">
                <Button variant="outline" size="sm" onClick={() => setSheetOpen(false)} className="text-xs h-9">
                  Close Sheet
                </Button>
                <Button
                  onClick={() => handleRecover(selectedCart.id)}
                  disabled={recovering === selectedCart.id}
                  className="text-xs h-9 gap-1.5"
                >
                  {recovering === selectedCart.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Mail className="h-3.5 w-3.5" />
                  )}
                  Send Recovery Notification
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
