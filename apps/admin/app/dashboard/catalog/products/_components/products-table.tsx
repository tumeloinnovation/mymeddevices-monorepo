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
  AlertTriangle,
  Layers,
  ExternalLink,
  Download,
} from "lucide-react";
import { Product, ProductStatus } from "@mymeddevices/shared-core";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useCategories, useBrands } from "../_hooks/use-products-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; icon: any; dotColor: string }
> = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    dotColor: "bg-slate-400 dark:bg-slate-500",
  },
  pending_review: {
    label: "Pending Review",
    icon: Clock,
    dotColor: "bg-amber-500 animate-pulse",
  },
  published: {
    label: "Published",
    icon: CheckCircle2,
    dotColor: "bg-emerald-500",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    dotColor: "bg-zinc-400",
  },
};

function StatusBadge({ status }: { status: ProductStatus }) {
  const cfg = STATUS_CONFIG[status] || { label: status, icon: FileEdit, dotColor: "bg-slate-400" };

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${cfg.dotColor} shrink-0`} />
      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
        {cfg.label}
      </span>
    </div>
  );
}

function StockBadge({ product }: { product: Product }) {
  const qty = product.stock_quantity ?? 0;
  const status = ((product.stock_status as unknown as string) || (qty > 0 ? "instock" : "outofstock")) as string;
  const threshold = product.low_stock_threshold || 5;
  const isOutOfStock = status === "outofstock" || qty === 0;
  const isLow = !isOutOfStock && qty <= threshold;
  const isBackorder = status === "backorder" || status === "onbackorder";
  const isOnDemand = status === "ondemand";

  if (isOutOfStock) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
        <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
        Out of Stock
      </span>
    );
  }

  if (isLow) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        Low stock ({qty} left)
      </span>
    );
  }

  if (isBackorder) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400">
        <Clock className="h-3.5 w-3.5 shrink-0 text-purple-500" />
        Backorder ({qty})
      </span>
    );
  }

  if (isOnDemand) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
        <Layers className="h-3.5 w-3.5 shrink-0 text-blue-500" />
        On Demand
      </span>
    );
  }

  return (
    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tabular-nums">
      {qty.toLocaleString()} in stock
    </span>
  );
}

function formatCurrency(amount: number, currency = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const columnHelper = createColumnHelper<Product & { vendor_name?: string }>();

interface ProductsTableProps {
  products: (Product & { vendor_name?: string })[];
  categories?: { id: string; name: string; slug?: string }[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  actionLoadingId: string | null;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onQuickAction: (id: string, action: "verify" | "publish" | "archive" | "unarchive" | "reject") => void;
  onDelete: (product: Product) => void;
  onStatusChange?: (product: Product) => void;
  onBulkAction?: (ids: string[], action: "verify" | "publish" | "archive" | "unarchive" | "delete") => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export function ProductsTable({
  products,
  categories,
  total,
  page,
  pageSize,
  isLoading,
  actionLoadingId,
  onPageChange,
  onPageSizeChange,
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

  const { data: fetchedCategories = [] } = useCategories();
  const { data: brandMap = new Map<string, string>() } = useBrands();
  const allCategories = categories && categories.length > 0 ? categories : fetchedCategories;

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    allCategories.forEach((cat) => {
      if (cat.id) map.set(cat.id, cat.name);
      if (cat.slug) map.set(cat.slug, cat.name);
    });
    return map;
  }, [allCategories]);

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
              className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 dark:data-[state=checked]:bg-white dark:data-[state=checked]:border-white"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center pl-2">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 dark:data-[state=checked]:bg-white dark:data-[state=checked]:border-white"
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
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors group cursor-pointer"
          >
            Product Details
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-slate-900 dark:text-white" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-slate-900 dark:text-white" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
            )}
          </button>
        ),
        cell: ({ getValue }) => {
          const product = getValue();

          return (
            <div className="flex items-center gap-3 py-1">
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-4 w-4 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <Link
                  href={`/dashboard/catalog/products/${product.id}`}
                  className="truncate max-w-[280px] text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title={product.name}
                >
                  {product.name}
                </Link>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-medium">
                    {product.sku || "NO-SKU"}
                  </span>
                  {product.vendor_name && (
                    <span className="text-[10px] text-slate-400">
                      · {product.vendor_name}
                    </span>
                  )}
                  {product.is_clinical_pick && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      ✓ Clinical Pick
                    </span>
                  )}
                  {product.is_featured && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      ★ Featured
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row, {
        id: "category_brand",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors group cursor-pointer"
          >
            Category & Brand
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-slate-900 dark:text-white" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-slate-900 dark:text-white" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
            )}
          </button>
        ),
        cell: ({ getValue }) => {
          const product = getValue();
          const rawVal = product.category_name;
          const catId = product.category_id;
          const catObj = (product as any).category;
          const isUuid = (val?: string) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

          let resolvedName: string | undefined;
          if (typeof catObj === "object" && catObj?.name) {
            resolvedName = catObj.name;
          } else if (catId && categoryMap.has(catId)) {
            resolvedName = categoryMap.get(catId);
          } else if (rawVal && categoryMap.has(rawVal)) {
            resolvedName = categoryMap.get(rawVal);
          } else if (rawVal && !isUuid(rawVal)) {
            resolvedName = rawVal;
          } else if (catId) {
            const match = allCategories.find((c) => c.id === catId || c.slug === catId);
            if (match) resolvedName = match.name;
          }

          const displayedBrand = product.brand
            ? brandMap.get(product.brand) || (product as any).brand_name || product.brand
            : null;

          return (
            <div className="flex flex-col gap-0.5 max-w-[200px]">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={resolvedName || "Medical Equipment"}>
                {resolvedName || "Medical Equipment"}
              </span>
              {displayedBrand ? (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate" title={displayedBrand}>
                  <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                  {displayedBrand}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 italic">Unbranded</span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row, {
        id: "status_stock",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors group cursor-pointer"
          >
            Status & Stock
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3 text-slate-900 dark:text-white" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3 text-slate-900 dark:text-white" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
            )}
          </button>
        ),
        cell: ({ getValue }) => {
          const product = getValue();
          return (
            <div className="flex flex-col gap-1.5 items-start">
              <StatusBadge status={product.status} />
              <StockBadge product={product} />
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
              className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors group cursor-pointer"
            >
              Price (KES)
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="h-3 w-3 text-slate-900 dark:text-white" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-3 w-3 text-slate-900 dark:text-white" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
              )}
            </button>
          </div>
        ),
        cell: ({ row }) => {
          const price = row.original.price || 0;
          return (
            <div className="flex justify-end w-full">
              <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(price, "KES")}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row, {
        id: "actions",
        header: () => (
          <div className="text-right pr-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Actions
          </div>
        ),
        cell: ({ getValue }) => {
          const product = getValue();
          const isLoading = actionLoadingId === product.id;

          if (isLoading) {
            return (
              <div className="flex items-center justify-end pr-2">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            );
          }

          return (
            <div className="flex items-center justify-end gap-1">
              {/* View Button - Always Visible */}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white gap-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="View Details"
              >
                <Link href={`/dashboard/catalog/products/${product.id}`}>
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-[11px]">View</span>
                </Link>
              </Button>

              {/* Edit Button - Always Visible */}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 gap-1 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                title="Edit Product"
              >
                <Link href={`/dashboard/catalog/products/${product.id}`}>
                  <Edit className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-[11px]">Edit</span>
                </Link>
              </Button>

              {/* Preview Button - Always Visible */}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 gap-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                title="Preview on Storefront"
              >
                <a
                  href={`http://localhost:3000/products/${product.slug || product.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-[11px]">Preview</span>
                </a>
              </Button>

              {/* Secondary Actions Menu (Archive & Delete) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                    <MoreVertical className="h-3.5 w-3.5 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 text-xs">
                  {product.status === "archived" ? (
                    <DropdownMenuItem
                      onClick={() => onQuickAction(product.id, "unarchive")}
                      className="cursor-pointer gap-2 text-blue-600"
                    >
                      <Package className="h-3.5 w-3.5" />
                      Restore Product
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => onQuickAction(product.id, "archive")}
                      className="cursor-pointer gap-2 text-slate-600 dark:text-slate-300"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archive Product
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-rose-600 cursor-pointer gap-2 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                    onClick={() => onDelete(product)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Product
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [actionLoadingId, onQuickAction, onDelete, categoryMap, allCategories, brandMap]
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

  const canPublish = selectedRows.some((r) => r.original.status === "pending_review");
  const canArchive = selectedRows.some((r) => r.original.status === "published");
  const canUnarchive = selectedRows.some((r) => r.original.status === "archived");
  const canDelete = selectedRows.length > 0;

  const handleBulkActionClick = (action: "verify" | "publish" | "archive" | "unarchive" | "delete") => {
    const ids = selectedRows.map((r) => r.original.id);
    if (ids.length === 0 || !onBulkAction) return;

    onBulkAction(ids, action);
    table.toggleAllRowsSelected(false);
  };

  const handleExportSelected = () => {
    if (selectedRows.length === 0) return;
    const rows = [
      ["ID", "SKU", "Name", "Category", "Brand", "Price (KES)", "Stock", "Status"],
      ...selectedRows.map((r) => [
        r.original.id,
        r.original.sku || "",
        `"${r.original.name.replace(/"/g, '""')}"`,
        r.original.category_id || "",
        r.original.brand || "",
        r.original.price || 0,
        r.original.stock_quantity || 0,
        r.original.status,
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Selected_Products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs p-6 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="h-10 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-4 text-left font-semibold text-xs text-slate-500 ${
                      header.id === "price" ? "text-right" : ""
                    } ${
                      header.id === "status" ? "text-center" : ""
                    } ${
                      header.id === "actions" ? "text-right pr-4" : ""
                    } ${
                      header.id === "select" ? "w-10 px-2" : ""
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
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="h-40 text-center text-xs text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="w-8 h-8 text-slate-300" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">No products found matching active filters.</p>
                    {hasActiveFilters && onClearFilters && (
                      <Button variant="outline" size="sm" onClick={onClearFilters} className="text-xs h-7">
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="h-12 border-b border-slate-100 dark:border-slate-800/80 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Footer controls */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-50/40 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <p className="tabular-nums">
              Showing <span className="font-bold text-slate-900 dark:text-white">{(page - 1) * pageSize + 1}</span> to{" "}
              <span className="font-bold text-slate-900 dark:text-white">{Math.min(page * pageSize, total)}</span> of{" "}
              <span className="font-bold text-slate-900 dark:text-white">{total}</span> products
            </p>

            {onPageSizeChange && (
              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-700">
                <span className="font-medium text-[11px] text-slate-500">Items per row:</span>
                <Select value={String(pageSize)} onValueChange={(val) => onPageSizeChange(Number(val))}>
                  <SelectTrigger className="h-7 w-[68px] text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs bg-white dark:bg-slate-800"
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
                  className={`h-8 w-8 text-xs font-semibold ${
                    page === pageNum ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : ""
                  }`}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs bg-white dark:bg-slate-800"
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-800 dark:border-slate-200">
          <div className="flex items-center gap-2 border-r border-slate-700 dark:border-slate-300 pr-3">
            <span className="text-xs font-bold">
              {selectedCount} selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canPublish && (
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs gap-1 font-semibold"
                onClick={() => handleBulkActionClick("publish")}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Approve & Publish
              </Button>
            )}

            {canArchive && (
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs gap-1 font-semibold"
                onClick={() => handleBulkActionClick("archive")}
              >
                <Archive className="h-3.5 w-3.5 text-slate-600" />
                Archive
              </Button>
            )}

            {canUnarchive && (
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs gap-1 font-semibold"
                onClick={() => handleBulkActionClick("unarchive")}
              >
                <Package className="h-3.5 w-3.5 text-blue-600" />
                Restore
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs gap-1 font-semibold"
              onClick={handleExportSelected}
            >
              <Download className="h-3.5 w-3.5 text-slate-600" />
              Export Selected
            </Button>

            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                className="h-8 text-xs gap-1 font-semibold"
                onClick={() => handleBulkActionClick("delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-slate-400 hover:text-white dark:hover:text-slate-900"
              onClick={() => table.toggleAllRowsSelected(false)}
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
