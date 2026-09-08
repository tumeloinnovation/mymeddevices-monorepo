"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Search,
  MoreVertical,
  Boxes,
  CheckCircle2,
  DollarSign,
  Layers,
  Trash2,
  Eye,
  Loader2,
  Power,
  PowerOff,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Types for Bundle API
interface BundleComponent {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  quantity: number;
  sort_order: number;
}

interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  discount_type: "FIXED_AMOUNT" | "PERCENTAGE";
  discount_value: number;
  funding_source: string;
  is_active: boolean;
  is_available: boolean;
  gross_customer_price: number | null;
  discount_amount: number | null;
  net_customer_price: number | null;
  components: BundleComponent[];
  created_at: string;
  updated_at: string;
}

export default function BundleDealsPage() {
  const router = useRouter();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || "";
    }
    return "";
  };

  // Fetch bundles
  const fetchBundles = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/bundles`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBundles(data);
      } else {
        console.error("Failed to fetch bundles:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch bundles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, []);

  const filteredBundles = bundles.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCount = bundles.filter((b) => b.is_active).length;
  const totalComponents = bundles.reduce((sum, b) => sum + (b.components?.length || 0), 0);

  const handleToggleActive = async (bundle: Bundle) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/bundles/${bundle.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({ is_active: !bundle.is_active }),
        }
      );

      if (response.ok) {
        setBundles((prev) =>
          prev.map((b) => (b.id === bundle.id ? { ...b, is_active: !b.is_active } : b))
        );
        toast.success("Bundle status updated");
      } else {
        toast.error("Failed to update bundle status");
      }
    } catch (error) {
      toast.error("Failed to update bundle status");
    }
  };

  const handleDelete = async (bundleId: string) => {
    if (!confirm("Are you sure you want to delete this bundle?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/bundles/${bundleId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        setBundles((prev) => prev.filter((b) => b.id !== bundleId));
        toast.success("Bundle deleted successfully");
      } else {
        toast.error("Failed to delete bundle");
      }
    } catch (error) {
      toast.error("Failed to delete bundle");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Bundle Deals & Equipment Packages</h1>
            <p className="text-muted-foreground text-sm">
              Create and manage merchandising bundles with automatic discount allocation.
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard/marketing/bundles/new")} className="bg-primary text-primary-foreground" size="lg">
            <Plus className="mr-2 h-4 w-4" /> Create Bundle
          </Button>
        </div>

        {/* Analytics Header Cards - Full Width */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Bundles</CardTitle>
              <Boxes className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{activeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Live equipment packages</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bundles</CardTitle>
              <Layers className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{bundles.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All merchandising bundles</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Components</CardTitle>
              <Package className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{totalComponents}</div>
              <p className="text-xs text-muted-foreground mt-1">Total component products</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Discount</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {bundles.length > 0
                  ? Math.round(
                      bundles.reduce(
                        (sum, b) => sum + (b.discount_type === "PERCENTAGE" ? b.discount_value : 0),
                        0
                      ) / bundles.length
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average bundle discount</p>
            </CardContent>
          </Card>
        </div>

        {/* Table Card - Full Width */}
        <Card className="border shadow-sm">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bundles by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold w-[30%]">Bundle Name & Description</TableHead>
                    <TableHead className="font-semibold w-[12%]">Components</TableHead>
                    <TableHead className="font-semibold w-[20%]">Discount & Pricing</TableHead>
                    <TableHead className="font-semibold w-[18%]">Status</TableHead>
                    <TableHead className="font-semibold text-right w-[20%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBundles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading bundles...
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Package className="h-8 w-8 text-muted-foreground/50" />
                            <p>No bundles found. Create your first bundle to get started.</p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBundles.map((b) => {
                      const discountDisplay =
                        b.discount_type === "PERCENTAGE"
                          ? `${b.discount_value}%`
                          : `Ksh ${b.discount_value?.toLocaleString()}`;

                      return (
                        <TableRow key={b.id} className="hover:bg-muted/30 transition-colors border-b">
                          <TableCell className="py-4">
                            <div className="font-semibold text-foreground">{b.name}</div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{b.description || b.slug}</p>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className="text-xs font-medium">
                              {b.components?.length || 0} items
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="font-bold text-sm text-emerald-600">{discountDisplay} OFF</div>
                            {b.net_customer_price && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Ksh {b.net_customer_price.toLocaleString()} bundle price
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              {b.is_active ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-muted-foreground text-xs font-medium">
                                  Inactive
                                </Badge>
                              )}
                              {!b.is_available && (
                                <Badge variant="outline" className="text-amber-600 border-amber-600/30 text-xs font-medium">
                                  Unavailable
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setSelectedBundle(b)} className="cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActive(b)} className="cursor-pointer">
                                  {b.is_active ? (
                                    <>
                                      <PowerOff className="mr-2 h-4 w-4 text-amber-500" /> Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <Power className="mr-2 h-4 w-4 text-emerald-500" /> Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(b.id)}
                                  className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete Bundle
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Details Dialog */}
      {selectedBundle && (
        <Dialog open={!!selectedBundle} onOpenChange={() => setSelectedBundle(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader className="space-y-2 pb-4">
              <DialogTitle className="text-xl">{selectedBundle.name}</DialogTitle>
              <DialogDescription className="text-sm">{selectedBundle.description || selectedBundle.slug}</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-2">
              {/* Discount Section */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Discount</Label>
                <div className="text-2xl font-bold text-emerald-600">
                  {selectedBundle.discount_type === "PERCENTAGE"
                    ? `${selectedBundle.discount_value}%`
                    : `Ksh ${selectedBundle.discount_value?.toLocaleString()}`}{" "}
                  OFF
                </div>
              </div>

              {/* Components Section */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Components ({selectedBundle.components?.length || 0})
                </Label>
                <div className="space-y-2 border rounded-lg p-4 bg-muted/30 max-h-64 overflow-y-auto">
                  {selectedBundle.components?.map((comp) => (
                    <div key={comp.id} className="flex items-center justify-between py-2 border-b last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm font-medium">{comp.product_name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">×{comp.quantity}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bundle Price */}
              {selectedBundle.net_customer_price && (
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-sm font-medium">Bundle Price:</span>
                  <span className="font-bold text-lg text-primary">
                    Ksh {selectedBundle.net_customer_price.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedBundle(null)} className="min-w-[100px]">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
