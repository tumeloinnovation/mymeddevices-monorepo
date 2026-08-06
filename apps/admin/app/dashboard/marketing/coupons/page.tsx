"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreVertical, Edit, Trash, Power, PowerOff, Loader2, Tag, Percent, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { shoppingService, Coupon } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingCouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await shoppingService.getCoupons();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load coupons", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === "all" ? true :
      filterStatus === "active" ? c.is_active : !c.is_active;
    return matchesSearch && matchesStatus;
  });

  const activeCount = coupons.filter(c => c.is_active).length;
  const percentageCount = coupons.filter(c => c.coupon_type === "percentage").length;
  const totalUses = coupons.reduce((sum, c) => sum + ((c as any).used_count || 0), 0);

  const handleToggleActive = async (coupon: Coupon) => {
    setActionLoading(coupon.id);
    try {
      await shoppingService.updateCoupon(coupon.id, { is_active: !coupon.is_active });
      toast.success(`Coupon ${coupon.is_active ? "deactivated" : "activated"}`);
      loadCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update coupon");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return;
    setActionLoading(coupon.id);
    try {
      await shoppingService.deleteCoupon(coupon.id);
      toast.success("Coupon deleted");
      loadCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete coupon");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Coupons & Promo Codes</h1>
            <p className="text-muted-foreground text-sm">
              Manage promotional codes, percentage discounts, and order threshold incentives.
            </p>
          </div>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/dashboard/marketing/coupons/new">
              <Plus className="mr-2 h-4 w-4" /> Create Coupon
            </Link>
          </Button>
        </div>

        {/* Analytics Header Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Coupons</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : coupons.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Configured promo campaigns</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Active Codes</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{loading ? "..." : activeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently redeemable by buyers</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Percentage Discounts</CardTitle>
              <Percent className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{loading ? "..." : percentageCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Percentage off order value</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Redemptions</CardTitle>
              <DollarSign className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{loading ? "..." : totalUses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Successful checkout uses</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search code or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("active")}
                >
                  Active
                </Button>
                <Button
                  variant={filterStatus === "inactive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("inactive")}
                >
                  Inactive
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type & Value</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Usage Limit</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredCoupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No coupons found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCoupons.map((coupon) => (
                      <TableRow key={coupon.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono font-bold text-foreground">
                          <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-primary" />
                            {coupon.code}
                          </div>
                          {coupon.description && (
                            <p className="text-xs text-muted-foreground font-normal line-clamp-1">
                              {coupon.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-foreground">
                            {coupon.coupon_type === "percentage"
                              ? `${coupon.discount_value}% OFF`
                              : `KSh ${Number(coupon.discount_value).toLocaleString()} OFF`}
                          </span>
                          {coupon.min_order_value && Number(coupon.min_order_value) > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Min spend: KSh {Number(coupon.min_order_value).toLocaleString()}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="capitalize text-sm">
                          <Badge variant="outline" className="text-xs">
                            {coupon.discount_scope.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {(coupon as any).used_count || 0} / {coupon.global_usage_limit || "∞"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {coupon.valid_until ? (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(coupon.valid_until).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No Expiry</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {coupon.is_active ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/20">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={actionLoading === coupon.id}>
                                {actionLoading === coupon.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/marketing/coupons/${coupon.id}`)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Coupon
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(coupon)}>
                                {coupon.is_active ? (
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
                                onClick={() => handleDelete(coupon)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" /> Delete Coupon
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
