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
  MoreVertical,
} from "lucide-react";
import { Product, ProductStatus } from "@mymeddevices/shared-core";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

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
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Product Details
          </span>
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
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Category
          </span>
        ),
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {getValue() || "General"}
          </span>
        ),
      }),
      columnHelper.accessor("stock_quantity", {
        id: "stock",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">
            Price (KES)
          </span>
        ),
        cell: ({ row }) => {
          const price = row.original.price || 0;
          return (
            <span className="text-sm font-medium tabular-nums text-foreground">
              {formatCurrency(price, "KES")}
            </span>
          );
        },
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
            Status
          </span>
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
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
  });

  if (isLoading && products.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="h-[34px] bg-muted/30 border-b" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-[36px] border-b last:border-0 animate-pulse bg-muted/20"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4 mx-auto">
          <Package className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">No products found</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Try adjusting your filters or search query.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="h-[34px] bg-muted/30">
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
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="h-[36px] border-b last:border-0 hover:bg-muted/30 transition-colors"
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
    </div>
  );
}

// Row Actions Component
function RowActions({
  product,
  onQuickAction,
  onDelete,
}: {
  product: Product;
  onQuickAction: (id: string, action: "verify" | "publish" | "archive" | "unarchive" | "reject") => void;
  onDelete: (product: Product) => void;
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

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(product)}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
