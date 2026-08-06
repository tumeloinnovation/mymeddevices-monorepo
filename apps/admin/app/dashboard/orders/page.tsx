"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  Package,
} from "lucide-react";
import {
  shoppingService,
  useAuthStore,
} from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Import new components
import { OrdersTable } from "./_components/orders-table";
import { StatusTabs } from "./_components/status-tabs";
import { AppliedFilterTags } from "./_components/applied-filter-tags";
import { OrderFilters } from "./_components/order-filters";
import { ActiveFilter } from "./types";

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
    <div className="px-4 py-3 bg-card border rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-4 w-4" />
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

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  // Filter state - initialize from URL query param
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "all"
  );

  // Update status filter and sync with URL
  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    // Update URL without triggering a navigation
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus === "all") {
      params.delete("status");
    } else {
      params.set("status", newStatus);
    }
    router.replace(`/dashboard/orders${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ from: null as Date | null, to: null as Date | null });
  const [amountRange, setAmountRange] = useState({ min: null as number | null, max: null as number | null });

  // Data state
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
  });

  // Computed active filters
  const activeFilters = useMemo(() => {
    const filters: ActiveFilter[] = [];

    if (statusFilter !== "all") {
      const statusLabels: Record<string, string> = {
        pending: "Pending",
        paid: "Paid",
        processing: "Processing",
        shipped: "Shipped",
        delivered: "Delivered",
        cancelled: "Cancelled",
        refunded: "Refunded",
      };
      filters.push({
        key: "status",
        label: statusLabels[statusFilter] || statusFilter,
        value: statusFilter,
      });
    }

    if (search) {
      filters.push({
        key: "search",
        label: `Search: "${search}"`,
        value: search,
      });
    }

    if (dateRange.from || dateRange.to) {
      const formatDate = (date: Date) => date.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
      let label = "Date: ";
      if (dateRange.from && dateRange.to) {
        label += `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
      } else if (dateRange.from) {
        label += `Since ${formatDate(dateRange.from)}`;
      } else if (dateRange.to) {
        label += `Until ${formatDate(dateRange.to)}`;
      }
      filters.push({ key: "date", label, value: { from: dateRange.from, to: dateRange.to } });
    }

    if (amountRange.min !== null || amountRange.max !== null) {
      let label = "Amount: KSh ";
      if (amountRange.min !== null && amountRange.max !== null) {
        label += `${amountRange.min.toLocaleString()} - ${amountRange.max.toLocaleString()}`;
      } else if (amountRange.min !== null) {
        label += `${amountRange.min.toLocaleString()}+`;
      } else if (amountRange.max !== null) {
        label += `Under ${amountRange.max.toLocaleString()}`;
      }
      filters.push({ key: "amount", label, value: { min: amountRange.min, max: amountRange.max } });
    }

    return filters;
  }, [statusFilter, search, dateRange, amountRange]);

  const hasActiveFilters = activeFilters.length > 0;

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      let response;
      const params: any = { page, page_size: pagination.pageSize };

      if (user?.role === "vendor") {
        response = await shoppingService.vendorListOrders(page, pagination.pageSize);
      } else {
        if (statusFilter !== "all") params.status = statusFilter;
        if (search) params.search = search;
        // Note: Backend API may not support all filter params yet
        // These would need to be added to the API or handled client-side
        if (dateRange.from) params.created_after = dateRange.from.toISOString();
        if (dateRange.to) params.created_before = dateRange.to.toISOString();
        if (amountRange.min !== null) params.amount_min = amountRange.min;
        if (amountRange.max !== null) params.amount_max = amountRange.max;

        response = await shoppingService.adminListOrders(params);
      }

      const responseData = response?.data || response;
      const ordersList = responseData?.orders || [];

      // Client-side filtering for filters not supported by API
      let filteredList = ordersList;
      if (search) {
        const q = search.toLowerCase();
        filteredList = filteredList.filter((o: any) =>
          o.id?.toLowerCase().includes(q) ||
          o.order_number?.toLowerCase().includes(q) ||
          o.user?.email?.toLowerCase().includes(q) ||
          o.user?.first_name?.toLowerCase().includes(q) ||
          o.user?.last_name?.toLowerCase().includes(q)
        );
      }
      if (amountRange.min !== null || amountRange.max !== null) {
        filteredList = filteredList.filter((o: any) => {
          const amount = o.total_amount || 0;
          if (amountRange.min !== null && amount < amountRange.min) return false;
          if (amountRange.max !== null && amount > amountRange.max) return false;
          return true;
        });
      }

      setOrders(filteredList);
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
      fetchOrders(1);
    }
  }, [user, statusFilter]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        fetchOrders(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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

  const handleBulkAction = async (orderIds: string[], action: string) => {
    try {
      // Process each order
      await Promise.all(
        orderIds.map((id) => shoppingService.adminUpdateOrderStatus(id, action))
      );
      toast.success(`${orderIds.length} orders updated to ${action}`);
      fetchOrders(pagination.page);
    } catch (error: any) {
      toast.error("Failed to update some orders");
    }
  };

  const handleRemoveFilter = (key: string) => {
    switch (key) {
      case "status":
        setStatusFilter("all");
        break;
      case "search":
        setSearch("");
        break;
      case "date":
        setDateRange({ from: null, to: null });
        break;
      case "amount":
        setAmountRange({ min: null, max: null });
        break;
    }
  };

  const handleClearAllFilters = () => {
    setStatusFilter("all");
    setSearch("");
    setDateRange({ from: null, to: null });
    setAmountRange({ min: null, max: null });
  };

  const stats = useMemo(() => {
    const total = pagination.total;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const pending = orders.filter((o) => o.status === "pending" || o.status === "paid").length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    return { total, delivered, pending, totalRevenue };
  }, [orders, pagination.total]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
          <p className="text-sm text-muted-foreground">
            Track, fulfill, and manage all customer orders across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(pagination.page)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/orders/statuses">View Order Workflows</Link>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Orders"
          value={stats.total}
          icon={ShoppingCart}
          trend={{ value: "+12.5%", positive: true }}
          trendLabel="vs last month"
        />
        <StatCard
          label="Pending / Paid"
          value={stats.pending}
          icon={Clock}
          trend={{ value: "Action Needed", positive: false }}
        />
        <StatCard
          label="Delivered"
          value={stats.delivered}
          icon={CheckCircle2}
          trend={{ value: "+8.2%", positive: true }}
        />
        <StatCard
          label="Order Revenue"
          value={`KSh ${(stats.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
        />
      </div>

      {/* Applied Filter Tags */}
      {hasActiveFilters && (
        <AppliedFilterTags
          filters={activeFilters}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-col gap-4 border-b pb-4">
        <StatusTabs
          currentValue={statusFilter}
          onChange={handleStatusChange}
        />
      </div>

      {/* Filter Bar */}
      <OrderFilters
        search={search}
        onSearchChange={setSearch}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        amountRange={amountRange}
        onAmountRangeChange={setAmountRange}
      />

      {/* Orders Table */}
      <OrdersTable
        orders={orders}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.pageSize}
        isLoading={loading}
        actionLoadingId={actionLoading}
        onPageChange={fetchOrders}
        onStatusUpdate={handleStatusUpdate}
        onBulkAction={handleBulkAction}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearAllFilters}
      />
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading orders...</div>}>
        <OrdersContent />
      </Suspense>
    </DashboardLayout>
  );
}
