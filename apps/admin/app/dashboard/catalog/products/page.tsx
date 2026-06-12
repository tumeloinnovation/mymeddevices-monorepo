"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  CheckCircle2,
  Clock,
  Archive,
  FileText,
  Package,
  ImageIcon,
  Loader2,
} from "lucide-react";
import {
  catalogService,
  Product,
  ProductStatus,
  CategoryTree,
} from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  draft: {
    label: "Draft",
    icon: <FileText className="h-3 w-3" />,
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
  pending_review: {
    label: "Pending Review",
    icon: <Clock className="h-3 w-3" />,
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  published: {
    label: "Published",
    icon: <CheckCircle2 className="h-3 w-3" />,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  archived: {
    label: "Archived",
    icon: <Archive className="h-3 w-3" />,
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const statusOrder: ProductStatus[] = [
  "pending_review",
  "published",
  "draft",
  "archived",
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null);

  const fetchProducts = async (
    page = 1,
    searchQuery = search,
    status = statusFilter,
    category = categoryFilter
  ) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: pagination.pageSize,
      };

      if (searchQuery) params.search = searchQuery;
      if (status !== "all") params.status_filter = status;
      if (category !== "all") params.category_id = category;

      const data = await catalogService.getVendorProducts(params);
      setProducts(data.products);
      setPagination({
        page: data.page,
        pageSize: data.page_size,
        total: data.total,
      });
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await catalogService.getCategories();
      // Flatten the category tree
      const flatCategories: CategoryTree[] = [];
      const flatten = (catList: CategoryTree[]) => {
        catList.forEach((cat) => {
          flatCategories.push(cat);
          if (cat.children?.length > 0) {
            flatten(cat.children);
          }
        });
      };
      flatten(cats);
      setCategories(flatCategories);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    // Check URL params for initial filter
    const initialStatus = searchParams.get("status");
    if (initialStatus && ["draft", "pending_review", "published", "archived"].includes(initialStatus)) {
      setStatusFilter(initialStatus);
    }

    fetchCategories();
    if (initialStatus) {
      fetchProducts(1, "", initialStatus, "all");
    } else {
      fetchProducts();
    }
  }, []);

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    fetchProducts(1, search, newStatus, categoryFilter);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchProducts(1, value, statusFilter, categoryFilter);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

    setActionLoading(deleteDialog.id);
    try {
      await catalogService.deleteProduct(deleteDialog.id);
      toast.success("Product deleted successfully");
      setDeleteDialog(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuickAction = async (
    id: string,
    action: "verify" | "publish" | "archive" | "unarchive"
  ) => {
    setActionLoading(id);
    try {
      switch (action) {
        case "verify":
          await catalogService.verifyProduct(id);
          toast.success("Product submitted for review");
          break;
        case "publish":
          await catalogService.publishProduct(id);
          toast.success("Product published successfully");
          break;
        case "archive":
          await catalogService.archiveProduct(id);
          toast.success("Product archived");
          break;
        case "unarchive":
          await catalogService.unarchiveProduct(id);
          toast.success("Product unarchived");
          break;
      }
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} product`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: ProductStatus) => {
    const config = STATUS_CONFIG[status];
    return (
      <Badge variant="outline" className={config.color}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage product listings, inventory, and pricing.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/catalog/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, or brand..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value) => handleStatusChange(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOrder.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_CONFIG[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  fetchProducts(1, search, statusFilter, value);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Products
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({pagination.total} total)
              </span>
            </CardTitle>
            <CardDescription>
              View and manage all product listings in the catalog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  {search || statusFilter !== "all" || categoryFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Get started by creating your first product"}
                </p>
                {!search && statusFilter === "all" && categoryFilter === "all" && (
                  <Button asChild>
                    <Link href="/dashboard/catalog/products/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium line-clamp-1">
                                {product.name}
                              </div>
                              {product.brand && (
                                <div className="text-sm text-muted-foreground">
                                  {product.brand}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                            {product.sku || "-"}
                          </code>
                        </TableCell>
                        <TableCell>
                          {product.category_name ? (
                            <Badge variant="outline">{product.category_name}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.tags && product.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
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
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {product.price
                              ? `${product.currency} ${product.price.toFixed(2)}`
                              : "-"}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={actionLoading === product.id}
                              >
                                {actionLoading === product.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/catalog/products/${product.id}`}
                                  className="cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/catalog/products/${product.id}`}
                                  className="cursor-pointer"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {product.status === "draft" && (
                                <DropdownMenuItem
                                  onClick={() => handleQuickAction(product.id, "verify")}
                                  disabled={actionLoading === product.id}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Submit for Review
                                </DropdownMenuItem>
                              )}
                              {product.status === "pending_review" && (
                                <DropdownMenuItem
                                  onClick={() => handleQuickAction(product.id, "publish")}
                                  disabled={actionLoading === product.id}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Approve & Publish
                                </DropdownMenuItem>
                              )}
                              {product.status === "published" && (
                                <DropdownMenuItem
                                  onClick={() => handleQuickAction(product.id, "archive")}
                                  disabled={actionLoading === product.id}
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              {product.status === "archived" && (
                                <DropdownMenuItem
                                  onClick={() => handleQuickAction(product.id, "unarchive")}
                                  disabled={actionLoading === product.id}
                                >
                                  <Package className="mr-2 h-4 w-4" />
                                  Unarchive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteDialog({ id: product.id, name: product.name })}
                                disabled={actionLoading === product.id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {pagination.total > pagination.pageSize && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
                  {pagination.total} products
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => fetchProducts(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      pagination.page * pagination.pageSize >= pagination.total
                    }
                    onClick={() => fetchProducts(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product?</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deleteDialog?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog(null)}
                disabled={actionLoading === deleteDialog?.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={actionLoading === deleteDialog?.id}
              >
                {actionLoading === deleteDialog?.id && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
