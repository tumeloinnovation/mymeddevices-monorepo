'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Search,
  Trash2,
  Eye,
  Package,
  Loader2,
  Send,
  Globe,
  Archive,
  RefreshCw,
  MoreHorizontal,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useProducts, useCategories } from '@/lib/api/hooks/useCatalog';
import { catalogApi } from '@/lib/api/endpoints/catalog';
import type { Product } from '@/lib/api/types';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, loading, error, refetch, deleteProduct } = useProducts({
    page,
    limit,
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
  });

  const { data: categories } = useCategories();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Product | null>(null);

  const handleLifecycleAction = async (action: string, product: Product) => {
    setActionLoading(`${action}-${product.id}`);
    try {
      switch (action) {
        case 'verify':
          await catalogApi.verifyProduct(product.id);
          toast.success('Product submitted for review');
          break;
        case 'archive':
          await catalogApi.archiveProduct(product.id);
          toast.success('Product archived');
          break;
        case 'unarchive':
          await catalogApi.unarchiveProduct(product.id);
          toast.success('Product restored to draft');
          break;
      }
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteProduct(deleteDialog.id);
      toast.success('Product deleted');
      setDeleteDialog(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const getStatusActions = (product: Product) => {
    const actions: { label: string; action: string; icon: React.ReactNode }[] = [];
    switch (product.status) {
      case 'draft':
        actions.push({ label: 'Submit for Review', action: 'verify', icon: <Send className="h-4 w-4" /> });
        break;
      case 'pending_review':
        // Vendor cannot publish - only admin can approve and publish
        // No actions available while pending review
        break;
      case 'published':
        actions.push({ label: 'Archive', action: 'archive', icon: <Archive className="h-4 w-4" /> });
        break;
      case 'archived':
        actions.push({ label: 'Restore to Draft', action: 'unarchive', icon: <RotateCcw className="h-4 w-4" /> });
        break;
    }
    return actions;
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => {
        const img = row.original.images?.[0];
        return (
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
              {img ? (
                <Image src={img.url} alt={img.alt_text || ''} width={40} height={40} className="size-full object-cover" />
              ) : (
                <Package className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm truncate max-w-[200px]">{row.original.name}</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight">
                {row.original.sku || row.original.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'category_name',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">
          {row.original.category_name || 'Uncategorized'}
        </span>
      ),
    },
    {
      accessorKey: 'base_price',
      header: 'Price',
      cell: ({ row }) => {
        const formatted = new Intl.NumberFormat('en-KE', {
          style: 'currency',
          currency: 'KES',
          minimumFractionDigits: 0,
        }).format(row.original.base_price ?? row.original.price ?? 0);
        return <div className="font-semibold">{formatted}</div>;
      },
    },
    {
      accessorKey: 'stock_quantity',
      header: 'Stock',
      cell: ({ row }) => {
        const stock = row.original.stock_quantity ?? 0;
        return (
          <div className={cn(
            'font-semibold text-xs',
            stock === 0 ? 'text-rose-600' : stock < (row.original.low_stock_threshold || 10) ? 'text-amber-600' : 'text-slate-700 dark:text-slate-350',
          )}>
            {stock} units
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status || 'draft';
        const rejection = row.original.rejection_reason;
        return (
          <div className="flex flex-col gap-1">
            <Badge className={cn(
              'text-[10px] px-2 py-0.5 w-fit font-medium',
              s === 'published' && 'bg-emerald-100 text-emerald-700',
              s === 'pending_review' && 'bg-amber-100 text-amber-700',
              s === 'archived' && 'bg-slate-200 text-slate-600',
              s === 'draft' && 'bg-slate-100 text-slate-500',
            )}>
              {s === 'published' && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
              {s === 'pending_review' && <Loader2 className="h-3 w-3 mr-1 inline animate-spin" />}
              {s === 'archived' && <Archive className="h-3 w-3 mr-1 inline" />}
              {s.replace('_', ' ').toUpperCase()}
            </Badge>
            {s === 'draft' && rejection && (
              <span className="text-[10px] text-rose-500 font-medium leading-tight" title={rejection}>
                Rejected: {rejection.length > 40 ? rejection.slice(0, 40) + '…' : rejection}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const product = row.original;
        const isLoading = actionLoading?.endsWith(product.id);
        const statusActions = getStatusActions(product);

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              asChild
            >
              <Link href={`/vendor/products/${product.id}`}>
                <Eye className="h-3.5 w-3.5" />
              </Link>
            </Button>

            {statusActions.map(({ label, action, icon }) => (
              <Button
                key={action}
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => handleLifecycleAction(action, product)}
                disabled={!!actionLoading}
                title={label}
              >
                {isLoading && actionLoading === `${action}-${product.id}` ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="sr-only">{label}</span>
                )}
                {icon}
              </Button>
            ))}

            {product.status === 'draft' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-rose-600 hover:text-rose-600 hover:bg-rose-50"
                onClick={() => setDeleteDialog(product)}
                title="Delete Product"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.items || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const isFiltered = searchTerm !== '' || statusFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-slate-500 mt-1">Manage your product catalog and inventory.</p>
        </div>
        <Button asChild>
          <Link href="/vendor/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setCategoryFilter('all');
              setPage(1);
            }}
            className="text-slate-500"
          >
            Clear Filters
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="size-10 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-2 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          <h2 className="font-semibold flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Failed to load product catalog
          </h2>
          <p className="text-sm mt-1 text-red-600">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="group">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-48 text-center"
                    >
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Package className="h-8 w-8" />
                        <p className="text-sm font-medium">No products found</p>
                        <p className="text-xs">Try adjusting your filters or create a new product.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {page} of {data?.pages || 1} ({data?.total || 0} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data?.pages || 1, p + 1))}
                disabled={page >= (data?.pages || 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteDialog?.name}</strong>? This action cannot be undone. Only draft products can be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
