"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
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
} from "lucide-react";
import { Product, ProductStatus } from "@mymeddevices/shared-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    color: "text-gray-700 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-900/40",
    border: "border-gray-200 dark:border-gray-800",
  },
  pending_review: {
    label: "Pending Review",
    icon: Clock,
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  published: {
    label: "Published",
    icon: CheckCircle2,
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  archived: {
    label: "Archived",
    icon: Package,
    color: "text-slate-700 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-800",
  },
};

function StatusBadge({ status }: { status: ProductStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={`${cfg.bg} ${cfg.color} ${cfg.border} flex w-fit items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium leading-tight`}
    >
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </Badge>
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
}: ProductsTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row, {
        id: "product",
        header: () => (
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Product Details
          </span>
        ),
        cell: ({ getValue }) => {
          const product = getValue();
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg border border-muted bg-muted/20">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <Link
                  href={`/dashboard/catalog/products/${product.id}`}
                  className="truncate max-w-[220px] text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {product.name}
                </Link>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
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
        header: () => (
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Category
          </span>
        ),
        cell: ({ getValue }) => (
          <Badge
            variant="secondary"
            className="text-[10px] font-medium px-2 py-0.5 bg-muted"
          >
            {getValue() || "General"}
          </Badge>
        ),
      }),
      columnHelper.accessor("stock_quantity", {
        id: "stock",
        header: () => (
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Stock
          </span>
        ),
        cell: ({ row }) => {
          const qty = row.original.stock_quantity;
          const threshold = row.original.low_stock_threshold || 5;
          const isLow = qty <= threshold;
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-2 w-2 rounded-full ${isLow ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}
                />
                <span
                  className={`text-xs font-semibold ${isLow ? "text-amber-600" : "text-foreground"}`}
                >
                  {qty} units
                </span>
              </div>
              {isLow && (
                <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-amber-500 mt-0.5">
                  Restock needed
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("price", {
        id: "price",
        header: () => (
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Price
          </span>
        ),
        cell: ({ row }) => {
          const price = row.original.price || 0;
          const compare = row.original.compare_at_price;
          const currency = row.original.currency;
          return (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {formatCurrency(price, currency)}
              </span>
              {compare && (
                <span className="text-[10px] text-muted-foreground line-through">
                  {formatCurrency(compare, currency)}
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: () => (
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Status
          </span>
        ),
        cell: ({ getValue }) => <StatusBadge status={getValue()} />,
      }),
      columnHelper.accessor((row) => row, {
        id: "actions",
        header: () => (
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Actions
          </span>
        ),
        cell: ({ getValue }) => {
          const product = getValue();
          const isLoading = actionLoadingId === product.id;

          return (
            <div className="flex items-center justify-end gap-0.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-muted-foreground/10"
                      disabled={isLoading}
                      asChild
                    >
                      <Link href={`/dashboard/catalog/products/${product.id}`}>
                        <Edit className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit product</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-muted-foreground/10"
                      disabled={isLoading}
                      asChild
                    >
                      <Link href={`/dashboard/catalog/products/${product.id}`}>
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Preview / view</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {product.status === "draft" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-emerald-50 hover:text-emerald-600"
                        disabled={isLoading}
                        onClick={() => onQuickAction(product.id, "verify")}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Submit for review</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {product.status === "pending_review" && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-emerald-50 hover:text-emerald-600"
                          disabled={isLoading}
                          onClick={() => onQuickAction(product.id, "publish")}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Approve & publish</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                          disabled={isLoading}
                          onClick={() => onQuickAction(product.id, "reject")}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reject</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}

              {product.status === "published" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-slate-100 hover:text-slate-600"
                        disabled={isLoading}
                        onClick={() => onQuickAction(product.id, "archive")}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Archive</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {product.status === "archived" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-muted-foreground/10"
                        disabled={isLoading}
                        onClick={() => onQuickAction(product.id, "unarchive")}
                      >
                        <Package className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Restore to draft</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                      disabled={isLoading}
                      onClick={() => onDelete(product)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete permanently</TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
  });

  if (isLoading && products.length === 0) {
    return (
      <div className="space-y-3 p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <h3 className="text-base font-bold">No products found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Try adjusting your filters or search query.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-y bg-muted/30">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left"
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
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="group border-b last:border-0 hover:bg-muted/20 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
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
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-muted/10 border-t gap-3">
          <p className="text-[11px] font-medium text-muted-foreground">
            Showing{" "}
            <span className="text-foreground">
              {(page - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="text-foreground">
              {Math.min(page * pageSize, total)}
            </span>{" "}
            of <span className="text-foreground">{total}</span> products
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs font-medium"
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
                  className="h-7 w-7 text-xs font-medium"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs font-medium"
              disabled={page * pageSize >= total || isLoading}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
