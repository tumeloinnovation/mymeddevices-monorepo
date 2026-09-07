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
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Store,
  CreditCard,
  AlertTriangle,
  FileText,
  User,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export type Order = {
  id: string;
  order_number?: string;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  } | null;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    street_address?: string;
    city?: string;
    state_or_province?: string;
    postal_code?: string;
    country?: string;
  } | null;
  items?: Array<{
    id?: string;
    product_id?: string;
    product_name?: string;
    title?: string;
    name?: string;
    quantity: number;
    price: number;
    unit_price?: number;
    subtotal?: number;
    vendor_name?: string;
    vendor_id?: string;
    image_url?: string;
  }> | null;
  order_items?: any[] | null;
  total_amount?: number;
  subtotal?: number;
  shipping_fee?: number;
  tax_amount?: number;
  payment_method?: string;
  payment_status?: string;
  transaction_id?: string;
  status: string;
  created_at?: string;
  internal_notes?: string;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "bg-amber-500/15 text-amber-600 border border-amber-500/20",
    badgeVariant: "outline",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    color: "bg-blue-500/15 text-blue-600 border border-blue-500/20",
    badgeVariant: "outline",
  },
  processing: {
    label: "Processing",
    icon: Package,
    color: "bg-indigo-500/15 text-indigo-600 border border-indigo-500/20",
    badgeVariant: "outline",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "bg-purple-500/15 text-purple-600 border border-purple-500/20",
    badgeVariant: "outline",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20",
    badgeVariant: "outline",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-destructive/15 text-destructive border border-destructive/20",
    badgeVariant: "destructive",
  },
  refunded: {
    label: "Refunded",
    icon: XCircle,
    color: "bg-neutral-500/15 text-neutral-600 border border-neutral-500/20",
    badgeVariant: "outline",
  },
};

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = (status || "pending").toLowerCase();
  const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${config.color}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

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
      <span>{children}</span>
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
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Quick Inspection Modal Dialog State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Cancel Confirmation Alert Dialog State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedOrderId(id);
    toast.success(`Copied #${text} to clipboard`);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const openInspectModal = (order: Order) => {
    setSelectedOrder(order);
    setInspectModalOpen(true);
  };

  const promptCancelOrder = (order: Order) => {
    setOrderToCancel(order);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setCancelling(true);
    try {
      await onStatusUpdate(orderToCancel.id, "cancelled");
      setCancelModalOpen(false);
      if (selectedOrder?.id === orderToCancel.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: "cancelled" } : null));
      }
      setOrderToCancel(null);
    } catch (error) {
      console.error(error);
    } finally {
      setCancelling(false);
    }
  };

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Order>();

    return [
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

      // Order Reference & Date (Composite Column: Top: Ref, Bottom: Date & Time)
      columnHelper.accessor("order_number", {
        id: "order_number",
        header: ({ column }) => <SortableHeader column={column}>Order & Date</SortableHeader>,
        cell: ({ row }) => {
          const order = row.original;
          const orderNumber = order.order_number || order.id?.substring(0, 8);
          const isCopied = copiedOrderId === order.id;
          const date = order.created_at ? new Date(order.created_at) : null;

          return (
            <div className="flex flex-col justify-center min-w-[130px]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openInspectModal(order)}
                  className="font-mono font-bold text-xs text-primary hover:underline hover:text-primary/80 transition-colors text-left"
                  title="Click to inspect order"
                >
                  #{orderNumber}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCopy(orderNumber, order.id, e)}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                  title="Copy reference code"
                >
                  {isCopied ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3 opacity-60 hover:opacity-100" />
                  )}
                </button>
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                {date
                  ? date.toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
          );
        },
      }),

      // Customer & Destination (Composite Column: Top: Name + Badge, Bottom: City/Email)
      columnHelper.accessor((row) => row, {
        id: "customer",
        header: ({ column }) => <SortableHeader column={column}>Customer & City</SortableHeader>,
        cell: ({ row }) => {
          const order = row.original;
          const name =
            order.user?.first_name || order.user?.last_name
              ? `${order.user.first_name || ""} ${order.user.last_name || ""}`.trim()
              : order.shipping_address?.full_name ||
                order.customer_name ||
                "Customer";

          const email = order.user?.email || order.customer_email;
          const city =
            order.shipping_address?.city ||
            order.shipping_address?.state_or_province ||
            "Nairobi";

          const initials = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase() || "CU";

          return (
            <div className="flex items-center gap-2.5 min-w-[170px]">
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                {initials}
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-xs font-semibold text-foreground truncate max-w-[150px]">
                  {name}
                </span>
                <span className="text-[11px] text-muted-foreground truncate max-w-[150px] flex items-center gap-1 mt-0.5">
                  <MapPin className="h-2.5 w-2.5 opacity-60 shrink-0" />
                  <span className="truncate">{city}</span>
                </span>
              </div>
            </div>
          );
        },
      }),

      // Items Breakdown (Count & Product Title Preview)
      columnHelper.accessor((row) => row, {
        id: "items",
        header: ({ column }) => <SortableHeader column={column}>Items</SortableHeader>,
        cell: ({ row }) => {
          const order = row.original;
          const itemsList = order.items || order.order_items || [];
          const itemsCount = itemsList.length > 0 ? itemsList.length : 1;
          const firstItem = itemsList[0];
          const firstItemName =
            firstItem?.product_name || firstItem?.title || firstItem?.name || "Medical Device";

          return (
            <div className="flex flex-col justify-center min-w-[140px] max-w-[190px]">
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-mono">
                  <Package className="h-2.5 w-2.5 mr-1 text-muted-foreground" />
                  {itemsCount} item{itemsCount !== 1 ? "s" : ""}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground truncate mt-0.5 opacity-85" title={firstItemName}>
                {firstItemName}
              </span>
            </div>
          );
        },
      }),

      // Total Amount & Payment (Composite: Amount on Top, Payment Method on Bottom)
      columnHelper.accessor("total_amount", {
        id: "total_amount",
        header: ({ column }) => (
          <div className="flex justify-end w-full">
            <SortableHeader column={column}>Total (KSh)</SortableHeader>
          </div>
        ),
        cell: ({ row }) => {
          const order = row.original;
          const amount = order.total_amount || 0;
          const paymentMethod = order.payment_method || "M-Pesa";

          return (
            <div className="flex flex-col items-end justify-center min-w-[110px]">
              <span className="text-xs font-bold tabular-nums text-foreground">
                KSh {amount.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                <CreditCard className="h-2.5 w-2.5 opacity-60" />
                {paymentMethod.replace(/_/g, " ")}
              </span>
            </div>
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
        cell: ({ getValue }) => (
          <div className="flex justify-center">
            <StatusBadge status={getValue()} />
          </div>
        ),
      }),

      // Quick 1-Click Action Icons
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right pr-2">Actions</div>,
        cell: ({ row }) => {
          const order = row.original;
          const isLoading = actionLoadingId === order.id;
          const status = (order.status || "pending").toLowerCase();

          return (
            <div className="flex items-center justify-end gap-1 pr-1">
              {/* 1-Click Quick Inspection Modal */}
              <Button
                size="icon-sm"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Quick Inspect Order"
                onClick={() => openInspectModal(order)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>

              {/* Fast 1-Click Status Advancement Button */}
              {status === "paid" && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-7 w-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  title="Start Processing"
                  disabled={isLoading}
                  onClick={() => onStatusUpdate(order.id, "processing")}
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
                </Button>
              )}

              {status === "processing" && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  title="Mark as Shipped"
                  disabled={isLoading}
                  onClick={() => onStatusUpdate(order.id, "shipped")}
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                </Button>
              )}

              {status === "shipped" && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  title="Mark as Delivered"
                  disabled={isLoading}
                  onClick={() => onStatusUpdate(order.id, "delivered")}
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                </Button>
              )}

              {/* Dropdown Menu for Extra Operations */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 shadow-lg">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/orders/${order.id}`} className="cursor-pointer text-xs">
                      <ExternalLink className="h-3.5 w-3.5 mr-2" />
                      Full Order Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onStatusUpdate(order.id, "processing")}
                    disabled={!["pending", "paid"].includes(status)}
                    className="text-xs"
                  >
                    <Package className="h-3.5 w-3.5 mr-2 text-indigo-600" />
                    Mark Processing
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onStatusUpdate(order.id, "shipped")}
                    disabled={!["processing"].includes(status)}
                    className="text-xs"
                  >
                    <Truck className="h-3.5 w-3.5 mr-2 text-purple-600" />
                    Mark Shipped
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onStatusUpdate(order.id, "delivered")}
                    disabled={!["shipped"].includes(status)}
                    className="text-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                    Mark Delivered
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive text-xs"
                    onClick={() => promptCancelOrder(order)}
                    disabled={["delivered", "cancelled", "refunded"].includes(status)}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-2" />
                    Cancel Order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ];
  }, [copiedOrderId, actionLoadingId, onStatusUpdate]);

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

  // Bulk action triggers
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
      <div className="border rounded-xl overflow-hidden bg-card shadow-2xs">
        <div className="p-4 space-y-3">
          <div className="h-8 bg-muted animate-pulse rounded-lg w-1/4" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="border border-dashed rounded-xl p-12 text-center bg-card shadow-2xs flex flex-col items-center justify-center">
        <div className="h-12 w-12 rounded-xl bg-muted/60 flex items-center justify-center mb-3 text-muted-foreground">
          <Package className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">No orders found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-4">
          {hasActiveFilters
            ? "No orders match your search or active filter settings."
            : "There are currently no customer orders placed in the marketplace."}
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
    <>
      <div className="border rounded-xl overflow-hidden bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="h-10 bg-muted/40 border-b">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-4 py-2 text-left font-semibold text-muted-foreground ${
                        header.id === "total_amount" ? "text-right" : ""
                      } ${header.id === "status" ? "text-center" : ""}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="h-14 hover:bg-muted/30 transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-4 py-2.5 ${
                        cell.column.id === "total_amount" ? "text-right" : ""
                      } ${cell.column.id === "status" ? "text-center" : ""}`}
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
          <div className="flex items-center justify-between px-6 py-3 bg-muted/15 border-t text-xs">
            <p className="text-muted-foreground tabular-nums">
              Showing <span className="font-semibold text-foreground">{(page - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-foreground">{Math.min(page * pageSize, total)}</span> of{" "}
              <span className="font-semibold text-foreground">{total}</span> orders
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                disabled={page === 1 || isLoading}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              <span className="text-muted-foreground tabular-nums px-2">
                Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                disabled={page * pageSize >= total || isLoading}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 border-r pr-4 border-border">
            <Checkbox
              checked={true}
              onCheckedChange={() => table.toggleAllRowsSelected(false)}
              className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-xs font-bold text-foreground">
              {selectedCount} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canProcess && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 border-indigo-500/30 text-indigo-600 hover:bg-indigo-50"
                onClick={() => handleBulkActionClick("processing")}
              >
                <Package className="h-3 w-3" />
                Process All
              </Button>
            )}

            {canShip && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 border-purple-500/30 text-purple-600 hover:bg-purple-50"
                onClick={() => handleBulkActionClick("shipped")}
              >
                <Truck className="h-3 w-3" />
                Ship All
              </Button>
            )}

            {canDeliver && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
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
                Cancel All
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Quick Order Inspection Centered Modal Dialog */}
      <Dialog open={inspectModalOpen} onOpenChange={setInspectModalOpen}>
        <DialogContent className="sm:max-w-[660px] p-0 overflow-hidden flex flex-col max-h-[85vh] shadow-xl">
          {selectedOrder && (
            <div className="flex flex-col h-full max-h-[85vh]">
              {/* Header */}
              <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <DialogTitle className="text-lg font-bold font-mono text-foreground">
                          Order #{selectedOrder.order_number || selectedOrder.id?.substring(0, 8)}
                        </DialogTitle>
                        <StatusBadge status={selectedOrder.status} />
                      </div>
                      <DialogDescription className="text-xs mt-0.5 text-muted-foreground">
                        Placed on{" "}
                        {selectedOrder.created_at
                          ? new Date(selectedOrder.created_at).toLocaleString()
                          : "N/A"}
                      </DialogDescription>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/orders/${selectedOrder.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Full Page
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </DialogHeader>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* Customer & Shipping Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Buyer Details */}
                  <div className="p-3.5 bg-muted/25 rounded-xl border space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> Buyer Info
                    </span>
                    <p className="font-semibold text-foreground text-sm">
                      {selectedOrder.user?.first_name || selectedOrder.user?.last_name
                        ? `${selectedOrder.user.first_name || ""} ${selectedOrder.user.last_name || ""}`.trim()
                        : selectedOrder.customer_name || "Customer"}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3 opacity-60" />
                      {selectedOrder.user?.email || selectedOrder.customer_email || "N/A"}
                    </p>
                    {(selectedOrder.user?.phone || selectedOrder.customer_phone || selectedOrder.shipping_address?.phone) && (
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3 opacity-60" />
                        {selectedOrder.user?.phone || selectedOrder.customer_phone || selectedOrder.shipping_address?.phone}
                      </p>
                    )}
                  </div>

                  {/* Shipping Address */}
                  <div className="p-3.5 bg-muted/25 rounded-xl border space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Delivery Destination
                    </span>
                    <p className="font-semibold text-foreground">
                      {selectedOrder.shipping_address?.full_name ||
                        selectedOrder.shipping_address?.street_address ||
                        "Standard Delivery"}
                    </p>
                    <p className="text-muted-foreground">
                      {[
                        selectedOrder.shipping_address?.street_address,
                        selectedOrder.shipping_address?.city,
                        selectedOrder.shipping_address?.state_or_province,
                        selectedOrder.shipping_address?.country || "Kenya",
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <div className="pt-0.5">
                      <Badge variant="outline" className="text-[10px]">
                        Courier Standard Delivery
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Ordered Items Table */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                    Itemized Order Lines
                  </span>
                  <div className="border rounded-xl overflow-hidden bg-card">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30 border-b">
                        <tr className="h-8 text-muted-foreground">
                          <th className="text-left px-3 py-1 font-semibold">Product</th>
                          <th className="text-center px-2 py-1 font-semibold w-16">Qty</th>
                          <th className="text-right px-2 py-1 font-semibold w-24">Price</th>
                          <th className="text-right px-3 py-1 font-semibold w-24">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(selectedOrder.items || selectedOrder.order_items || []).map((item, idx) => {
                          const name = item.product_name || item.title || item.name || "Medical Device Item";
                          const qty = item.quantity || 1;
                          const price = item.price || item.unit_price || 0;
                          const subtotal = item.subtotal || price * qty;

                          return (
                            <tr key={idx} className="h-10 hover:bg-muted/15">
                              <td className="px-3 py-2">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-foreground line-clamp-1">
                                    {name}
                                  </span>
                                  {item.vendor_name && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Store className="h-2.5 w-2.5" />
                                      {item.vendor_name}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center font-mono">{qty}</td>
                              <td className="px-2 py-2 text-right font-mono tabular-nums text-muted-foreground">
                                KSh {price.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-right font-bold font-mono tabular-nums text-foreground">
                                KSh {subtotal.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Totals */}
                <div className="p-3.5 bg-muted/15 rounded-xl border flex flex-col gap-1.5 ml-auto max-w-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Payment Method:</span>
                    <span className="font-semibold text-foreground">
                      {selectedOrder.payment_method || "M-Pesa"}
                    </span>
                  </div>
                  {selectedOrder.transaction_id && (
                    <div className="flex justify-between text-muted-foreground font-mono">
                      <span>Receipt Code:</span>
                      <span className="font-bold text-foreground">
                        {selectedOrder.transaction_id}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t">
                    <span>Total Amount:</span>
                    <span className="text-primary font-mono tabular-nums">
                      KSh {(selectedOrder.total_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Generously Padded Footer */}
              <DialogFooter className="p-4 sm:p-5 border-t bg-muted/15 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => promptCancelOrder(selectedOrder)}
                  disabled={["delivered", "cancelled", "refunded"].includes(selectedOrder.status)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-9 order-last sm:order-first"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Cancel Order
                </Button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInspectModalOpen(false)}
                    className="text-xs h-9"
                  >
                    Close
                  </Button>

                  {selectedOrder.status === "paid" && (
                    <Button
                      type="button"
                      onClick={() => {
                        onStatusUpdate(selectedOrder.id, "processing");
                        setInspectModalOpen(false);
                      }}
                      className="text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Package className="h-3.5 w-3.5 mr-1" />
                      Start Processing
                    </Button>
                  )}

                  {selectedOrder.status === "processing" && (
                    <Button
                      type="button"
                      onClick={() => {
                        onStatusUpdate(selectedOrder.id, "shipped");
                        setInspectModalOpen(false);
                      }}
                      className="text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Truck className="h-3.5 w-3.5 mr-1" />
                      Mark as Shipped
                    </Button>
                  )}

                  {selectedOrder.status === "shipped" && (
                    <Button
                      type="button"
                      onClick={() => {
                        onStatusUpdate(selectedOrder.id, "delivered");
                        setInspectModalOpen(false);
                      }}
                      className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Mark Delivered
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Order Safety Confirmation Alert Dialog */}
      <AlertDialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <AlertDialogContent className="sm:max-w-[440px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <AlertDialogTitle className="text-base font-bold text-foreground">
                  Cancel Customer Order?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                  This action marks the order as cancelled and interrupts fulfillment.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          {orderToCancel && (
            <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1 my-2">
              <div className="flex justify-between items-center font-bold">
                <span>
                  #{orderToCancel.order_number || orderToCancel.id?.substring(0, 8)}
                </span>
                <span className="text-destructive">
                  KSh {(orderToCancel.total_amount || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-muted-foreground truncate">
                Buyer: {orderToCancel.customer_name || orderToCancel.user?.email || "Customer"}
              </p>
            </div>
          )}

          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel disabled={cancelling} className="h-9 text-xs">
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={cancelling}
              className="h-9 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? "Cancelling..." : "Confirm Cancellation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
