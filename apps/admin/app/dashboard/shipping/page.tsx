"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Search,
  CheckCircle2,
  Clock,
  Package,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  shoppingService,
} from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import Link from "next/link";

export default function ShippingPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const response = await shoppingService.listShipments();
      setShipments(response);
    } catch (error) {
      console.error("Failed to load shipments:", error);
      toast.error("Failed to load shipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "shipped":
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Shipped</Badge>;
      case "delivered":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Delivered</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-orange-600">Shipping</h1>
          <p className="text-muted-foreground">
            Track all dispatched orders and fulfillment status.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shipment Tracking</CardTitle>
            <CardDescription>
              Manage logistics and monitor the delivery status of all orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : shipments.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No shipments found</h3>
                <p className="text-muted-foreground">Shipments will appear here once orders are processed for delivery.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking Number</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Est. Delivery</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-mono text-xs">
                          {shipment.tracking_number || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/dashboard/orders/${shipment.order_id}`}
                            className="text-orange-600 hover:underline flex items-center gap-1"
                          >
                            {shipment.order_id.split("-")[0]}...
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                        <TableCell>{shipment.carrier || "Standard"}</TableCell>
                        <TableCell>
                          {shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleDateString() : "TBD"}
                        </TableCell>
                        <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                             <Link href={`/dashboard/orders/${shipment.order_id}`}>
                               View Order
                             </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
