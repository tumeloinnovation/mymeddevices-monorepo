'use client';

import React, { useState } from 'react';
import {
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Loader2,
  Package,
  XCircle,
} from 'lucide-react';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useProducts } from '@/lib/api/hooks/useCatalog';
import { catalogApi } from '@/lib/api/endpoints/catalog';

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

function getStockStatus(stock: number, threshold: number): StockStatus {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= threshold) return 'low_stock';
  return 'in_stock';
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, loading, error, refetch } = useProducts({
    page,
    limit,
    search: searchTerm || undefined,
  });

  const items = (data?.items || []).map((p) => ({
    product_id: p.id,
    product_name: p.name,
    sku: p.sku || '',
    stock_quantity: p.stock_quantity ?? 0,
    low_stock_threshold: p.low_stock_threshold || 5,
    status: getStockStatus(p.stock_quantity ?? 0, p.low_stock_threshold || 5),
    last_updated: p.updated_at,
  }));

  const filteredItems = stockFilter === 'all'
    ? items
    : items.filter((i) => i.status === stockFilter);

  const handleAdjustStock = async (productId: string, productName: string, amount: number) => {
    try {
      const product = data?.items?.find((p) => p.id === productId);
      const newStock = Math.max(0, (product?.stock_quantity ?? 0) + amount);
      await catalogApi.updateProduct(productId, { stock_quantity: newStock });
      toast.success(`Stock adjusted for ${productName}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to adjust stock');
    }
  };

  const totalSKUs = data?.total || 0;
  const outOfStockCount = items.filter((i) => i.status === 'out_of_stock').length;
  const lowStockCount = items.filter((i) => i.status === 'low_stock').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-slate-500 mt-1">Monitor and adjust your stock levels.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSKUs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{outOfStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or SKU..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={stockFilter} onValueChange={(value) => { setStockFilter(value); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          <h2 className="font-semibold flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Failed to load inventory
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
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Quick Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length ? (
                  filteredItems.map((item) => (
                    <TableRow key={item.product_id} className="group">
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{item.product_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {item.sku || '—'}
                      </TableCell>
                      <TableCell className={cn(
                        'text-center font-bold',
                        item.status === 'out_of_stock' && 'text-rose-600',
                        item.status === 'low_stock' && 'text-amber-600',
                      )}>
                        {item.stock_quantity}
                      </TableCell>
                      <TableCell className="text-center text-slate-500 text-sm">
                        {item.low_stock_threshold}
                      </TableCell>
                      <TableCell>
                        {item.status === 'out_of_stock' ? (
                          <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
                        ) : item.status === 'low_stock' ? (
                          <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleAdjustStock(item.product_id, item.product_name, -1)}
                            disabled={item.stock_quantity <= 0}
                            title="Decrease stock by 1"
                          >
                            <ArrowDownCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleAdjustStock(item.product_id, item.product_name, 1)}
                            title="Increase stock by 1"
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Package className="h-8 w-8" />
                        <p className="text-sm font-medium">No inventory items found</p>
                        <p className="text-xs">Try adjusting your search or filters.</p>
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
    </div>
  );
}
