"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Archive, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { 
  catalogService, 
  Product, 
  ProductStatus 
} from "@mymeddevices/shared-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await catalogService.getVendorProducts({
        search: search || undefined,
        status_filter: statusFilter === "all" ? undefined : statusFilter,
        page,
        page_size: pageSize
      });
      setProducts(response.products);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleArchive = async (id: string) => {
    try {
      await catalogService.archiveProduct(id);
      toast.success("Product archived");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to archive product");
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      await catalogService.unarchiveProduct(id);
      toast.success("Product restored to draft");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to restore product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    try {
      await catalogService.deleteProduct(id);
      toast.success("Product deleted");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200"><CheckCircle2 className="size-3 mr-1" /> Published</Badge>;
      case "pending_review":
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200"><Clock className="size-3 mr-1" /> Pending Review</Badge>;
      case "archived":
        return <Badge variant="secondary" className="text-muted-foreground"><Archive className="size-3 mr-1" /> Archived</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-600"><Edit className="size-3 mr-1" /> Draft</Badge>;
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your medical device catalog and inventory.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="size-4 mr-2" />
            Add New Product
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                <Filter className="size-4" />
                <span>Filter:</span>
              </div>
              <Select 
                value={statusFilter} 
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[50px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[30px]" /></TableCell>
                    </TableRow>
                  ))
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          <div className="flex gap-2">
                            {product.brand && (
                              <span className="text-xs text-muted-foreground">{product.brand}</span>
                            )}
                            <span className="text-xs text-muted-foreground">{product.sku || "No SKU"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={product.stock_quantity <= product.low_stock_threshold ? "text-destructive font-medium" : ""}>
                            {product.stock_quantity}
                          </span>
                          {product.stock_quantity <= product.low_stock_threshold && (
                            <AlertTriangle className="size-3.5 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.price ? `${product.currency} ${product.price.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>
                        {product.tags && product.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {product.tags.slice(0, 2).map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {product.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{product.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/products/${product.id}`}>
                                <Edit className="size-4 mr-2" />
                                Edit Details
                              </Link>
                            </DropdownMenuItem>
                            {product.status === "published" && (
                              <DropdownMenuItem onClick={() => handleArchive(product.id)}>
                                <Archive className="size-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            {product.status === "archived" && (
                              <DropdownMenuItem onClick={() => handleUnarchive(product.id)}>
                                <Clock className="size-4 mr-2" />
                                Restore to Draft
                              </DropdownMenuItem>
                            )}
                            {product.status === "draft" && (
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(product.id)}
                              >
                                <Trash2 className="size-4 mr-2" />
                                Delete Draft
                              </DropdownMenuItem>
                            )}
                            {product.status === "published" && (
                              <DropdownMenuItem asChild>
                                <a href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="size-4 mr-2" />
                                  View on Store
                                </a>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="size-4 mr-2" />
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
                <ChevronRight className="size-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
