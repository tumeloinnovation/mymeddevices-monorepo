"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  MoreVertical,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  XCircle,
  Loader2,
  Calendar,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import {
  shoppingService,
  useAuthStore,
} from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "bg-warning/15 text-warning border border-warning/20",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    color: "bg-primary/15 text-primary border border-primary/20",
  },
  processing: {
    label: "Processing",
    icon: Clock,
    color: "bg-blue-15 text-blue-500 border border-blue/20",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "bg-purple-15 text-purple-500 border border-purple/20",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "bg-success/15 text-success border border-success/20",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-destructive/15 text-destructive border border-destructive/20",
  },
  refunded: {
    label: "Refunded",
    icon: XCircle,
    color: "bg-destructive/15 text-destructive border border-destructive/20",
  },
};

// Stat Card Component
function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  trend?: { value: string; positive: boolean } | null;
  trendLabel?: string;
  icon: any;
}) {
  return (
    <div className="px-4 py-3 bg-card border rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
      </div>
      <div className="text-[24px] font-semibold tabular-nums tracking-tight">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-1">
          <span
            className={`text-xs font-medium tabular-nums ${
              trend.positive ? "text-success" : "text-destructive"
            }`}
          >
            {trend.value}
          </span>
          {trendLabel && (
            <span className="text-xs text-muted-foreground">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

// Filter Chip Component
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${config.color}`}
    >
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
}

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = async (page = 1, status = statusFilter) => {
    setLoading(true);
    try {
      let response;
      if (user?.role === "vendor") {
        response = await shoppingService.vendorListOrders(page, pagination.pageSize);
      } else {
        const params: any = { page, page_size: pagination.pageSize };
        if (status !== "all") params.status = status;
        response = await shoppingService.adminListOrders(params);
      }

      const responseData = response?.data || response;
      const ordersList = responseData?.orders || [];
      setOrders(ordersList);
      setPagination((prev) => ({
        ...prev,
        page,
        total: responseData?.total ?? ordersList.length ?? 0,
      }));
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId);
    try {
      await shoppingService.adminUpdateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders(pagination.page);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = pagination.total;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const pending = orders.filter((o) => o.status === "pending" || o.status === "paid").length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    return { total, delivered, pending, totalRevenue };
  }, [orders, pagination.total]);

  const STATUS_TABS = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const getCustomerName = (order: any) => {
    if (order.user) {
      const first = order.user.first_name || "";
      const last = order.user.last_name || "";
      const name = `${first} ${last}`.trim();
      return name || order.user.email;
    }
    if (order.shipping_address) {
      if (order.shipping_address.full_name) {
        return order.shipping_address.full_name;
      }
      if (order.shipping_address.first_name || order.shipping_address.last_name) {
        const first = order.shipping_address.first_name || "";
        const last = order.shipping_address.last_name || "";
        return `${first} ${last}`.trim();
      }
    }
    return "Guest User";
  };

  const getCustomerEmail = (order: any) => {
    if (order.user) {
      return order.user.email;
    }
    if (order.guest_token) {
      return `guest-${order.guest_token.substring(0, 8)}@mymeddevices.com`;
    }
    return "guest@mymeddevices.com";
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    fetchOrders(1, value);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px]/[28px] font-semibold tracking-tight">
              Orders
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage transactions and track order fulfillment
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              Export
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Orders"
            value={stats.total}
            trend={{ value: "+12", positive: true }}
            trendLabel="this month"
            icon={ShoppingCart}
          />
          <StatCard
            label="Delivered"
            value={stats.delivered}
            trend={{ value: "+8", positive: true }}
            trendLabel="vs last month"
            icon={CheckCircle2}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            trend={stats.pending > 0 ? { value: "!", positive: false } : null}
            trendLabel="needs attention"
            icon={Clock}
          />
          <StatCard
            label="Revenue"
            value={`KES ${(stats.totalRevenue / 1000).toFixed(1)}k`}
            trend={{ value: "+15%", positive: true }}
            trendLabel="vs last month"
            icon={DollarSign}
          />
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1">
            {STATUS_TABS.map((tab) => (
              <FilterChip
                key={tab.value}
                active={statusFilter === tab.value}
                onClick={() => handleStatusChange(tab.value)}
              >
                {tab.label}
              </FilterChip>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="h-[34px] bg-muted/30 border-b" />
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-[36px] border-b last:border-0 animate-pulse bg-muted/20"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="border rounded-lg p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4 mx-auto">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">No orders found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Orders will appear here once customers start checking out.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="h-[34px] bg-muted/30">
                    <th className="px-4 text-left">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Order ID
                      </span>
                    </th>
                    <th className="px-4 text-left">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Customer
                      </span>
                    </th>
                    <th className="px-4 text-left">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Date
                      </span>
                    </th>
                    <th className="px-4 text-left">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Items
                      </span>
                    </th>
                    <th className="px-4 text-right">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Total Amount
                      </span>
                    </th>
                    <th className="px-4 text-center">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Status
                      </span>
                    </th>
                    <th className="px-4 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const customerName = getCustomerName(order);
                    const customerEmail = getCustomerEmail(order);

                    const dateStr = order.created_at;
                    const formattedDate = dateStr
                      ? new Date(dateStr).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A";

                    const itemCount =
                      order.items?.reduce(
                        (sum: number, item: any) => sum + item.quantity,
                        0
                      ) || 0;

                    const formattedAmount = new Intl.NumberFormat("en-KE", {
                      style: "currency",
                      currency: "KES",
                      minimumFractionDigits: 0,
                    }).format(order.total_amount);

                    return (
                      <tr
                        key={order.id}
                        className="h-[36px] border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4">
                          <Link
                            href={`/dashboard/shopping/orders/${order.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {order.order_number ||
                              order.id.substring(0, 8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-4">
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {customerName}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {customerEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-4">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formattedDate}
                            </span>
                          </div>
                        </td>
                        <td className="px-4">
                          <span className="text-xs text-muted-foreground">
                            {itemCount} item{itemCount !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-4 text-right">
                          <span className="text-sm font-medium tabular-nums text-foreground">
                            {formattedAmount}
                          </span>
                        </td>
                        <td className="px-4">
                          <div className="flex justify-center">
                            <StatusBadge status={order.status} />
                          </div>
                        </td>
                        <td className="px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={actionLoading === order.id}
                              >
                                {actionLoading === order.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/shopping/orders/${order.id}`}
                                  className="cursor-pointer"
                                >
                                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                                  View details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user?.role === "admin" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(order.id, "paid")}
                                  >
                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                    Mark as Paid
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(order.id, "shipped")}
                                  >
                                    <Truck className="mr-1.5 h-3.5 w-3.5" />
                                    Mark as Shipped
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(order.id, "delivered")}
                                  >
                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-success" />
                                    Mark as Delivered
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(order.id, "cancelled")}
                                    className="text-destructive"
                                  >
                                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                    Cancel Order
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="flex items-center justify-between px-4 py-2 bg-muted/10 border-t">
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  Showing{" "}
                  <span className="text-foreground">
                    {(pagination.page - 1) * pagination.pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="text-foreground">
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                  </span>{" "}
                  of <span className="text-foreground">{pagination.total}</span> orders
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs"
                    disabled={pagination.page === 1 || loading}
                    onClick={() => fetchOrders(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({
                    length: Math.min(5, Math.ceil(pagination.total / pagination.pageSize)),
                  }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "ghost"}
                        size="icon"
                        className="h-8 w-8 text-xs font-medium"
                        onClick={() => fetchOrders(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs"
                    disabled={
                      pagination.page * pagination.pageSize >= pagination.total || loading
                    }
                    onClick={() => fetchOrders(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
