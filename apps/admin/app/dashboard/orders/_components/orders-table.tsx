"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import {
  Package,
  Eye,
  Loader2,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Order type (will be refined based on actual Order type from shared-core)
type Order = {
  id: string;
  order_number?: string;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  customer_name?: string;
  customer_email?: string;
  shipping_address?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
  } | null;
  items?: any[] | null;
  order_items?: any[] | null;
  total_amount?: number;
  status: string;
  created_at?: string;
};

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
    color: "bg-blue-500/15 text-blue-600 border border-blue-500/20",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "bg-purple-500/15 text-purple-600 border border-purple-500/20",
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

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${config.color}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

// Sortable header component
function SortableHeader({
  children,
  column,
}: {
  children: React.ReactNode;
  column: any;
}) {
  return (
    <button
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex items-center gap-1 hover:text-foreground text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors group cursor-pointer"
    >
      {children}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="h-3 w-3 text-primary" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="h-3 w-3 text-primary" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50" />
      )}
    </button>
  );
}

// Customer cell component
function CustomerCell({ order }: { order: Order }) {
  const getCustomerName = (order: Order) => {
    if (order.user) {
      const first = order.user.first_name || "";
      const last = order.user.last_name || "";
      const name = `${first} ${last}`.trim();
      return name || order.user.email;
    }
    if (order.shipping_address) {
      return (
        order.shipping_address.full_name ||
        `${order.shipping_address.first_name || ""} ${order.shipping_address.last_name || ""}`.trim()
      );
    }
    return order.customer_name || "Guest Customer";
  };

  const getCustomerEmail = (order: Order) => {
    return order.user?.email || order.customer_email || "N/A";
  };

  return (
    <div>
      <div className="font-medium text-sm">{getCustomerName(order)}</div>
      <div className="text-xs text-muted-foreground">{getCustomerEmail(order)}</div>
    </div>
  );
}

// Row actions dropdown
function RowActions({
  order,
  onStatusUpdate,
  isLoading,
}: {
  order: Order;
  onStatusUpdate: (orderId: string, status: string) => void;
  isLoading?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" className="h-7 w-7" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <MoreVertical className="h-3.5 w-3.5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/orders/${order.id}`} className="cursor-pointer">
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onStatusUpdate(order.id, "processing")}
          disabled={!["pending", "paid"].includes(order.status)}
        >
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          Mark Processing
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusUpdate(order.id, "shipped")}
          disabled={!["processing"].includes(order.status)}
        >
          <Truck className="h-3.5 w-3.5 mr-1.5" />
          Mark Shipped
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusUpdate(order.id, "delivered")}
          disabled={!["shipped"].includes(order.status)}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
          Mark Delivered
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => onStatusUpdate(order.id, "cancelled")}
          disabled={["delivered", "cancelled", "refunded"].includes(order.status)}
        >
          <XCircle className="h-3.5 w-3.5 mr-1.5" />
          Cancel Order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columnHelper = createColumnHelper<Order>();

interface OrdersTableProps {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  actionLoadingId: string | null;
  onPageChange: (page: number) => void;
  onStatusUpdate: (orderId: string, status: string) => void;
  onBulkAction?: (orderIds: string[], action: string) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export function OrdersTable({
  orders,
  total,
  page,
  pageSize,
  isLoading,
  actionLoadingId,
  onPageChange,
  onStatusUpdate,
  onBulkAction,
  hasActiveFilters,
  onClearFilters,
}: OrdersTableProps) {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      // Select column
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center pl-2">
            <Checkbox
              checked={
                table.getIsAllRowsSelected() ||
                (table.getIsSomeRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
              aria-label="Select all"
              className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center pl-2">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      }),

      // Order Reference
      columnHelper.accessor("order_number", {
        id: "order_number",
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.order_number || rowA.original.id || "";
          const b = rowB.original.order_number || rowB.original.id || "";
          return a.localeCompare(b);
        },
        header: ({ column }) => <SortableHeader column={column}>Order Ref</SortableHeader>,
        cell: ({ row }) => {
          const orderNumber = row.original.order_number || row.original.id?.substring(0, 8);
          return (
            <Link
              href={`/dashboard/orders/${row.original.id}`}
              className="text-sm font-mono font-medium text-primary hover:underline"
            >
              #{orderNumber}
            </Link>
          );
        },
      }),

      // Customer
      columnHelper.accessor((row) => row, {
        id: "customer",
        sortingFn: (rowA, rowB) => {
          const nameA = rowA.original.user?.first_name || rowA.original.customer_name || "";
          const nameB = rowB.original.user?.first_name || rowB.original.customer_name || "";
          return nameA.localeCompare(nameB);
        },
        header: ({ column }) => <SortableHeader column={column}>Customer</SortableHeader>,
        cell: ({ getValue }) => <CustomerCell order={getValue()} />,
      }),

      // Items
      columnHelper.accessor((row) => row, {
        id: "items",
        header: ({ column }) => <SortableHeader column={column}>Items</SortableHeader>,
        cell: ({ getValue }) => {
          const itemsCount = getValue().items?.length || getValue().order_items?.length || 1;
          return (
            <span className="text-xs font-mono text-muted-foreground">
              {itemsCount} item{itemsCount !== 1 ? "s" : ""}
            </span>
          );
        },
      }),

      // Total Amount
      columnHelper.accessor("total_amount", {
        id: "total_amount",
        header: ({ column }) => (
          <div className="flex justify-end w-full">
            <SortableHeader column={column}>Total Amount</SortableHeader>
          </div>
        ),
        cell: ({ row }) => {
          const amount = row.original.total_amount || 0;
          return (
            <span className="text-sm font-medium tabular-nums text-foreground text-right block w-full">
              KSh {amount.toLocaleString()}
            </span>
          );
        },
      }),

      // Status
      columnHelper.accessor("status", {
        id: "status",
        header: ({ column }) => (
          <div className="flex justify-center w-full">
            <SortableHeader column={column}>Status</SortableHeader>
          </div>
        ),
        cell: ({ getValue }) => <div className="flex justify-center"><StatusBadge status={getValue()} /></div>,
      }),

      // Date
      columnHelper.accessor("created_at", {
        id: "created_at",
        header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
        cell: ({ row }) => {
          const date = row.original.created_at;
          if (!date) return <span className="text-xs text-muted-foreground">N/A</span>;
          return (
            <span className="text-xs text-muted-foreground">
              {new Date(date).toLocaleDateString("en-KE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          );
        },
      }),

      // Actions
      columnHelper.display({
        id: "actions",
        header: () => null,
        cell: ({ row }) => (
          <RowActions
            order={row.original}
            onStatusUpdate={onStatusUpdate}
            isLoading={actionLoadingId === row.original.id}
          />
        ),
      }),
    ],
    [actionLoadingId, onStatusUpdate]
  );

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      rowSelection,
      sorting,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
    getRowId: (row) => row.id,
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  // Bulk action conditions
  const canProcess = selectedRows.some((r) => ["pending", "paid"].includes(r.original.status));
  const canShip = selectedRows.some((r) => r.original.status === "processing");
  const canDeliver = selectedRows.some((r) => r.original.status === "shipped");
  const canCancel = selectedRows.some((r) =>
    !["delivered", "cancelled", "refunded"].includes(r.original.status)
  );

  const handleBulkActionClick = (action: string) => {
    const ids = selectedRows.map((r) => r.original.id);
    if (ids.length === 0 || !onBulkAction) return;

    onBulkAction(ids, action);
    table.toggleAllRowsSelected(false);
  };

  // Loading skeleton
  if (isLoading && orders.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden bg-card border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="h-[34px] bg-muted/30 border-b">
                <th className="w-10 px-4">
                  <Skeleton className="h-4 w-4 rounded" />
                </th>
                <th className="px-4 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Order Ref</span>
                </th>
                <th className="px-4 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Customer</span>
                </th>
                <th className="px-4 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Items</span>
                </th>
                <th className="px-4 text-right">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Amount</span>
                </th>
                <th className="px-4 text-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
                </th>
                <th className="px-4 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</span>
                </th>
                <th className="w-12 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="h-[36px] border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 text-center">
                    <Skeleton className="h-4 w-4 rounded mx-auto" />
                  </td>
                  <td className="px-4">
                    <Skeleton className="h-3 w-20 rounded" />
                  </td>
                  <td className="px-4">
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-3 w-24 rounded" />
                      <Skeleton className="h-2 w-32 rounded" />
                    </div>
                  </td>
                  <td className="px-4">
                    <Skeleton className="h-3 w-12 rounded" />
                  </td>
                  <td className="px-4 text-right">
                    <Skeleton className="h-3 w-16 rounded ml-auto" />
                  </td>
                  <td className="px-4 text-center">
                    <Skeleton className="h-4.5 w-16 rounded-full mx-auto" />
                  </td>
                  <td className="px-4">
                    <Skeleton className="h-3 w-16 rounded" />
                  </td>
                  <td className="px-4 text-center">
                    <Skeleton className="h-5 w-5 rounded mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center bg-card border-border flex flex-col items-center justify-center">
        <div className="h-12 w-12 rounded-xl bg-muted/30 flex items-center justify-center mb-4 text-muted-foreground">
          <Package className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">No orders found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-4">
          {hasActiveFilters
            ? "Your search or filter criteria did not match any orders."
            : "There are currently no orders in the system."}
        </p>
        {hasActiveFilters && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters} className="h-8 text-xs">
            Clear all filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card border-border relative">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="h-[34px] bg-muted/30 border-b">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-4 text-left ${
                      header.id === "total_amount" ? "text-right" : ""
                    } ${
                      header.id === "status" ? "text-center" : ""
                    }`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="h-[36px] border-b last:border-0 hover:bg-muted/10 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-4 ${
                      cell.column.id === "total_amount" ? "text-right" : ""
                    } ${
                      cell.column.id === "status" ? "text-center" : ""
                    }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/10 border-t">
          <p className="text-[11px] text-muted-foreground tabular-nums">
            Showing <span className="text-foreground">{(page - 1) * pageSize + 1}</span> to{" "}
            <span className="text-foreground">{Math.min(page * pageSize, total)}</span> of{" "}
            <span className="text-foreground">{total}</span> orders
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs"
              disabled={page === 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            {Array.from({
              length: Math.min(5, Math.ceil(total / pageSize)),
            }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8 text-xs font-medium"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs"
              disabled={page * pageSize >= total || isLoading}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-2xl rounded-xl px-4 py-2.5 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 border-r pr-3 border-border">
            <Checkbox
              checked={true}
              onCheckedChange={() => table.toggleAllRowsSelected(false)}
              className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-xs font-semibold text-foreground">
              {selectedCount} selected
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {canProcess && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 border-success/30 text-success hover:bg-success/10"
                onClick={() => handleBulkActionClick("processing")}
              >
                <Clock className="h-3 w-3" />
                Mark Processing
              </Button>
            )}

            {canShip && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 border-info/30 text-info hover:bg-info/10"
                onClick={() => handleBulkActionClick("shipped")}
              >
                <Truck className="h-3 w-3" />
                Mark Shipped
              </Button>
            )}

            {canDeliver && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 border-success/30 text-success hover:bg-success/10"
                onClick={() => handleBulkActionClick("delivered")}
              >
                <CheckCircle2 className="h-3 w-3" />
                Mark Delivered
              </Button>
            )}

            {canCancel && (
              <Button
                variant="destructive"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => handleBulkActionClick("cancelled")}
              >
                <XCircle className="h-3 w-3" />
                Cancel Orders
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
