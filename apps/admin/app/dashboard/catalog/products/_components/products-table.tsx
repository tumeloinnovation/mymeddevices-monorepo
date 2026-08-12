"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Edit,
  Eye,
  Trash2,
  CheckCircle2,
  Archive,
  XCircle,
  Loader2,
  Building2,
  FileEdit,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
} from "lucide-react";
import { Product, ProductStatus } from "@mymeddevices/shared-core";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; icon: any }
> = {
  draft: {
    label: "Draft",
    icon: FileEdit,
  },
  pending_review: {
    label: "Pending",
    icon: Clock,
  },
  published: {
    label: "Published",
    icon: CheckCircle2,
  },
  archived: {
    label: "Archived",
    icon: Archive,
  },
};

function StatusBadge({ status }: { status: ProductStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  const variants = {
    draft: "bg-muted text-muted-foreground",
    pending_review: "bg-warning/15 text-warning border border-warning/20",
    published: "bg-success/15 text-success border border-success/20",
    archived: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
        variants[status]
      }`}
    >
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

function formatCurrency(amount: number, currency = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE")}`;
}

const columnHelper = createColumnHelper<Product & { vendor_name?: string }>();

interface ProductsTableProps {
  products: (Product & { vendor_name?: string })[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  actionLoadingId: string | null;
  onPageChange: (page: number) => void;
  onQuickAction: (id: string, action: "verify" | "publish" | "archive" | "unarchive" | "reject") => void;
  onDelete: (product: Product) => void;
  onStatusChange?: (product: Product) => void;
  onBulkAction?: (ids: string[], action: "verify" | "publish" | "archive" | "unarchive" | "delete") => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export function ProductsTable({
  products,
  total,
  page,
  pageSize,
  isLoading,
  actionLoadingId,
  onPageChange,
  onQuickAction,
  onDelete,
  onStatusChange,
  onBulkAction,
  hasActiveFilters,
  onClearFilters,
}: ProductsTableProps) {
  const router = useRouter();
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
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
      columnHelper.accessor((row) => row, {
        id: "product",
        sortingFn: (rowA, rowB) => rowA.original.name.localeCompare(rowB.original.name),
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-foreground text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors group cursor-pointer"
          >
            Product Details
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-primary" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50" />
            )}
          </button>
        ),
        cell: ({ getValue }) => {
          const product = getValue();
          return (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-muted/20 border">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-3.5 w-3.5 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <Link
                  href={`/dashboard/catalog/products/${product.id}`}
                  className="truncate max-w-[220px] text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {product.name}
                </Link>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    {product.sku || "NO-SKU"}
                  </span>
                  {product.brand && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Building2 className="h-2.5 w-2.5" />
                      {product.brand}
                    </span>
                  )}
                  {product.vendor_name && (
                    <span className="text-[10px] text-muted-foreground">
                      · {product.vendor_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("category_name", {
        id: "category",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-foreground text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors group cursor-pointer"
          >
            Category
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-primary" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50" />
            )}
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {getValue() || "General"}
          </span>
        ),
      }),
      columnHelper.accessor("product_type", {
        id: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.product_type || "simple";
          const varCount = row.original.variants?.length || 0;
          const bundleCount = row.original.bundle_items?.length || 0;

          if (type === "variable") {
            return (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                🔀 Variable ({varCount})
              </span>
            );
          }
          if (type === "bundle") {
            return (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                📋 Bundle ({bundleCount})
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              📦 Simple
            </span>
          );
        },
      }),
      columnHelper.accessor("stock_quantity", {
        id: "stock",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-foreground text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors group cursor-pointer"
          >
            Stock
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-primary" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const qty = row.original.stock_quantity;
          const threshold = row.original.low_stock_threshold || 5;
          const isLow = qty <= threshold;
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    isLow ? "bg-warning" : "bg-success"
                  }`}
                />
                <span
                  className={`text-xs font-medium tabular-nums ${
                    isLow ? "text-warning" : "text-foreground"
                  }`}
                >
                  {qty} units
                </span>
              </div>
              {isLow && (
                <span className="text-[9px] uppercase tracking-[0.15em] font-medium text-warning mt-0.5">
                  Low stock
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("price", {
        id: "price",
        header: ({ column }) => (
          <div className="flex justify-end w-full">
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="flex items-center gap-1 hover:text-foreground text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors group cursor-pointer"
            >
              Price (KES)
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="h-3 w-3 text-primary" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-3 w-3 text-primary" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50" />
              )}
            </button>
          </div>
        ),
        cell: ({ row }) => {
          const price = row.original.price || 0;
          return (
            <span className="text-sm font-medium tabular-nums text-foreground text-right block w-full">
              {formatCurrency(price, "KES")}
            </span>
          );
        },
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: ({ column }) => (
          <div className="flex justify-center w-full">
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="flex items-center gap-1 hover:text-foreground text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors group cursor-pointer"
            >
              Status
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="h-3 w-3 text-primary" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-3 w-3 text-primary" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50" />
              )}
            </button>
          </div>
        ),
        cell: ({ getValue }) => (
          <div className="flex justify-center">
            <StatusBadge status={getValue()} />
          </div>
        ),
      }),
      columnHelper.accessor((row) => row, {
        id: "actions",
        header: () => null,
        cell: ({ getValue }) => {
          const product = getValue();
          const isLoading = actionLoadingId === product.id;

          return (
            <div className="flex items-center justify-end">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <RowActions
                  product={product}
                  onQuickAction={onQuickAction}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                />
              )}
            </div>
          );
        },
      }),
    ],
    [actionLoadingId, onQuickAction, onDelete]
  );

  const table = useReactTable({
    data: products,
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

  const canSubmit = selectedRows.some((r) => r.original.status === "draft");
  const canPublish = selectedRows.some((r) => r.original.status === "pending_review");
  const canArchive = selectedRows.some((r) => r.original.status === "published");
  const canUnarchive = selectedRows.some((r) => r.original.status === "archived");
  const canDelete = selectedRows.length > 0 && selectedRows.every((r) => r.original.status === "draft");

  const handleBulkActionClick = (action: "verify" | "publish" | "archive" | "unarchive" | "delete") => {
    const ids = selectedRows.map((r) => r.original.id);
    if (ids.length === 0 || !onBulkAction) return;

    onBulkAction(ids, action);
    table.toggleAllRowsSelected(false);
  };

  const handleRowKeyDown = (
    e: React.KeyboardEvent<HTMLTableRowElement>,
    product: Product,
    index: number
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.key === " ") {
        table.getRow(product.id).toggleSelected();
      } else {
        router.push(`/dashboard/catalog/products/${product.id}`);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextRow = e.currentTarget.nextElementSibling as HTMLTableRowElement | null;
      if (nextRow) nextRow.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevRow = e.currentTarget.previousElementSibling as HTMLTableRowElement | null;
      if (prevRow) prevRow.focus();
    } else if (e.key === "e") {
      e.preventDefault();
      router.push(`/dashboard/catalog/products/${product.id}`);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onDelete(product);
    }
  };

  if (isLoading && products.length === 0) {
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
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product Details</span>
                </th>
                <th className="px-4 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</span>
                </th>
                <th className="px-4 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Stock</span>
                </th>
                <th className="px-4 text-right">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Price (KES)</span>
                </th>
                <th className="px-4 text-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
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
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
                      <div className="flex flex-col gap-1 w-full max-w-[180px]">
                        <Skeleton className="h-3 w-[80%] rounded" />
                        <Skeleton className="h-2 w-[40%] rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4">
                    <Skeleton className="h-3.5 w-16 rounded" />
                  </td>
                  <td className="px-4">
                    <Skeleton className="h-3.5 w-12 rounded" />
                  </td>
                  <td className="px-4 text-right">
                    <Skeleton className="h-3.5 w-20 rounded ml-auto" />
                  </td>
                  <td className="px-4 text-center">
                    <Skeleton className="h-4.5 w-16 rounded-full mx-auto" />
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

  if (products.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center bg-card border-border flex flex-col items-center justify-center">
        <div className="h-12 w-12 rounded-xl bg-muted/30 flex items-center justify-center mb-4 text-muted-foreground">
          <Package className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">No products found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-4">
          {hasActiveFilters
            ? "Your search or filter criteria did not match any products in the catalog."
            : "There are currently no products in the catalog. Click the button below to add your first product."}
        </p>
        {hasActiveFilters && onClearFilters ? (
          <Button variant="outline" size="sm" onClick={onClearFilters} className="h-8 text-xs">
            Clear all filters
          </Button>
        ) : (
          <Button size="sm" asChild className="h-8 text-xs">
            <Link href="/dashboard/catalog/products/new">
              Add first product
            </Link>
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
                      header.id === "price" ? "text-right" : ""
                    } ${
                      header.id === "status" ? "text-center" : ""
                    }`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                tabIndex={0}
                onKeyDown={(e) => handleRowKeyDown(e, row.original, index)}
                className="h-[36px] border-b last:border-0 hover:bg-muted/10 focus:bg-muted/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset transition-colors cursor-pointer"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-4 ${
                      cell.column.id === "price" ? "text-right" : ""
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
            <span className="text-foreground">{total}</span> products
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
            {canSubmit && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 border-success/30 text-success hover:bg-success/10"
                onClick={() => handleBulkActionClick("verify")}
              >
                <CheckCircle2 className="h-3 w-3" />
                Submit review
              </Button>
            )}
            
            {canPublish && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 border-success/30 text-success hover:bg-success/10"
                onClick={() => handleBulkActionClick("publish")}
              >
                <CheckCircle2 className="h-3 w-3" />
                Approve & Publish
              </Button>
            )}

            {canArchive && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 border-border text-foreground hover:bg-muted"
                onClick={() => handleBulkActionClick("archive")}
              >
                <Archive className="h-3 w-3" />
                Archive
              </Button>
            )}

            {canUnarchive && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 border-border text-foreground hover:bg-muted"
                onClick={() => handleBulkActionClick("unarchive")}
              >
                <Package className="h-3 w-3" />
                Restore
              </Button>
            )}

            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => handleBulkActionClick("delete")}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Row Actions Component
function RowActions({
  product,
  onQuickAction,
  onDelete,
  onStatusChange,
}: {
  product: Product;
  onQuickAction: (id: string, action: "verify" | "publish" | "archive" | "unarchive" | "reject") => void;
  onDelete: (product: Product) => void;
  onStatusChange?: (product: Product) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" className="h-7 w-7">
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/catalog/products/${product.id}`} className="cursor-pointer">
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/catalog/products/${product.id}`} className="cursor-pointer">
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View details
          </Link>
        </DropdownMenuItem>

        {product.status === "draft" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onQuickAction(product.id, "verify")}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-success" />
              Submit for review
            </DropdownMenuItem>
          </>
        )}

        {product.status === "pending_review" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onQuickAction(product.id, "publish")}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-success" />
              Approve & publish
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onQuickAction(product.id, "reject")}>
              <XCircle className="h-3.5 w-3.5 mr-1.5 text-warning" />
              Reject
            </DropdownMenuItem>
          </>
        )}

        {product.status === "published" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onQuickAction(product.id, "archive")}>
              <Archive className="h-3.5 w-3.5 mr-1.5" />
              Archive
            </DropdownMenuItem>
          </>
        )}

        {product.status === "archived" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onQuickAction(product.id, "unarchive")}>
              <Package className="h-3.5 w-3.5 mr-1.5" />
              Restore to draft
            </DropdownMenuItem>
          </>
        )}

        {onStatusChange && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onStatusChange(product)}>
              <FileEdit className="h-3.5 w-3.5 mr-1.5" />
              Change status
            </DropdownMenuItem>
          </>
        )}

        {product.status === "draft" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(product)}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
