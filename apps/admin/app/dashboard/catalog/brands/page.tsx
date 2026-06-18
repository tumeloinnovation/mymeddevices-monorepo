"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Globe,
  ImageIcon,
  LayoutDashboard,
  ChevronRight,
  Download,
  Building2,
  ArrowUpRight,
  ExternalLink,
  MoreVertical,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { catalogService, Brand } from "@mymeddevices/shared-core";
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
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";

const brandFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().optional(),
  description: z.string().optional(),
  logo_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

type BrandFormData = z.infer<typeof brandFormSchema>;

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const form = useForm<BrandFormData>({
    resolver: standardSchemaResolver(brandFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      logo_url: "",
      website_url: "",
      is_active: true,
    },
  });

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await catalogService.getBrands({
        active_only: false,
        page,
        page_size: pageSize,
      });

      if (response?.brands) {
        setBrands(response.brands);
        setTotal(response.total);
      }
    } catch (error) {
      console.error("Failed to load brands:", error);
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [page]);

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (data: BrandFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        slug: data.slug || undefined,
        logo_url: data.logo_url || undefined,
        website_url: data.website_url || undefined,
      };

      if (editingBrand) {
        await catalogService.updateBrand(editingBrand.id, payload);
        toast.success("Manufacturer profile updated");
      } else {
        await catalogService.createBrand(payload);
        toast.success("New brand added to catalog");
      }

      setDialogOpen(false);
      setEditingBrand(null);
      form.reset();
      fetchBrands();
    } catch (error) {
      console.error("Failed to save brand:", error);
      toast.error(editingBrand ? "Failed to update brand" : "Failed to create brand");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    form.reset({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || "",
      logo_url: brand.logo_url || "",
      website_url: brand.website_url || "",
      is_active: brand.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (brand: Brand) => {
    try {
      await catalogService.deleteBrand(brand.id);
      toast.success("Brand removed from catalog");
      fetchBrands();
    } catch (error) {
      console.error("Failed to delete brand:", error);
      toast.error("Deletion failed. Ensure no products are linked to this brand.");
    }
  };

  const openCreateDialog = () => {
    setEditingBrand(null);
    form.reset({
      name: "",
      slug: "",
      description: "",
      logo_url: "",
      website_url: "",
      is_active: true,
    });
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-[1600px] mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/dashboard/catalog" className="hover:text-primary transition-colors">
            Catalog
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Brands</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b pb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Manufacturers</h1>
            <p className="text-muted-foreground text-base mt-2">
              Manage the brands and manufacturing partners associated with your products.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-11 px-6 shadow-sm">
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
            <Button className="h-11 px-6 shadow-md shadow-primary/20" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Brand
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Brands List */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="shadow-xl shadow-foreground/5 border-muted/50 overflow-hidden">
              <CardHeader className="bg-muted/30 border-b p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold">Brand Directory</CardTitle>
                    <CardDescription className="text-sm">Showing {filteredBrands.length} of {total} registered brands</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search brands..." 
                      className="pl-10 w-full sm:w-[280px] bg-background h-10 rounded-xl"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : filteredBrands.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                      <Building2 className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">No brands found</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                      {search ? "No results match your search query." : "Start by adding your first manufacturing partner."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/50 border-y">
                        <TableRow>
                          <TableHead className="w-[350px] font-bold text-foreground py-4 px-6">BRAND IDENTITY</TableHead>
                          <TableHead className="font-bold text-foreground">PRODUCTS</TableHead>
                          <TableHead className="font-bold text-foreground">STATUS</TableHead>
                          <TableHead className="text-right font-bold text-foreground px-6">ACTIONS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBrands.map((brand) => (
                          <TableRow key={brand.id} className="group hover:bg-muted/30 transition-all border-b last:border-0">
                            <TableCell className="py-5 px-6">
                              <div className="flex items-center gap-4">
                                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-muted bg-muted/20 group-hover:border-primary/20 transition-colors shadow-sm">
                                  {brand.logo_url ? (
                                    <img
                                      src={brand.logo_url}
                                      alt={brand.name}
                                      className="h-full w-full object-contain p-1 transition-transform group-hover:scale-110"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        e.currentTarget.parentElement!.innerHTML = '<div class="flex h-full w-full items-center justify-center font-bold text-primary bg-primary/5 uppercase">' + brand.name.charAt(0) + '</div>';
                                      }}
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center font-bold text-primary bg-primary/5 uppercase">
                                      {brand.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate max-w-[220px] font-bold text-foreground text-base group-hover:text-primary transition-colors">
                                    {brand.name}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-mono font-black text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      {brand.slug}
                                    </span>
                                    {brand.website_url && (
                                      <a 
                                        href={brand.website_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline text-[10px] font-bold flex items-center gap-1"
                                      >
                                        <Globe className="h-3 w-3" />
                                        WEBSITE
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-base">{brand.product_count}</span>
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active SKU's</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {brand.is_active ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-bold px-3 py-1 flex items-center w-fit gap-1.5 shadow-sm">
                                  <CheckCircle2 className="h-3 w-3" />
                                  ACTIVE
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="font-bold px-3 py-1 flex items-center w-fit gap-1.5">
                                  <XCircle className="h-3 w-3" />
                                  INACTIVE
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right px-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-muted-foreground/10 rounded-full">
                                    <MoreVertical className="h-5 w-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-muted">
                                  <DropdownMenuLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 px-2 py-1.5">Brand Options</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleEdit(brand)} className="rounded-xl py-3 cursor-pointer">
                                    <Edit className="h-4 w-4 mr-3" /> Edit Brand Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild className="rounded-xl py-3 cursor-pointer">
                                    <Link href={`/dashboard/catalog/products?brand=${brand.name}`}>
                                      <Building2 className="h-4 w-4 mr-3" /> View All Products
                                    </Link>
                                  </DropdownMenuItem>
                                  {brand.website_url && (
                                    <DropdownMenuItem asChild className="rounded-xl py-3 cursor-pointer">
                                      <a href={brand.website_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-3" /> Official Website
                                      </a>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive focus:bg-destructive/5 rounded-xl py-3 cursor-pointer"
                                    onClick={() => handleDelete(brand)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-3" /> Delete Brand
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
                {total > pageSize && (
                  <div className="flex items-center justify-between p-6 bg-muted/10 border-t">
                    <p className="text-sm font-medium text-muted-foreground">
                      Page <span className="text-foreground">{page}</span> of <span className="text-foreground">{Math.ceil(total / pageSize)}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-6 font-bold rounded-xl"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-6 font-bold rounded-xl"
                        disabled={page >= Math.ceil(total / pageSize)}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Insights */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card className="shadow-lg border-muted/50 overflow-hidden">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Portfolio Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Brands</span>
                  <span className="text-2xl font-black">{total}</span>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">Top Manufacturers</span>
                  {brands.slice(0, 3).map((b, i) => (
                    <div key={b.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold">
                          {i+1}
                        </div>
                        <span className="text-sm font-bold">{b.name}</span>
                      </div>
                      <Badge variant="secondary" className="font-bold">{b.product_count} products</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 p-8 text-white shadow-xl shadow-violet-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10 flex flex-col gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                  <Building2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Partner Access</h3>
                  <p className="text-violet-100 mt-2 leading-relaxed font-medium">
                    Vendors can manage their own brand profiles. Admins provide oversight and final approval of descriptions and logos.
                  </p>
                </div>
                <Button variant="secondary" className="w-fit bg-white text-violet-600 font-bold hover:bg-violet-50 border-0 rounded-xl" asChild>
                  <Link href="/dashboard/vendors">
                    View Vendors <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[550px] rounded-3xl p-0 overflow-hidden shadow-2xl">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="p-8 bg-muted/30 border-b">
                <DialogHeader>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-inner">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <DialogTitle className="text-2xl font-black tracking-tight">{editingBrand ? "Edit Brand Profile" : "New Brand Partner"}</DialogTitle>
                  <DialogDescription className="text-sm pt-1">
                    Manage the manufacturer identity and public presence in the catalog.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="grid gap-6 p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Manufacturer Name *</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="e.g. Medtronic"
                      className="h-12 text-base font-bold border-muted-foreground/20 rounded-xl focus:ring-primary"
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs font-bold text-destructive">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">URL Slug</Label>
                    <Input
                      id="slug"
                      {...form.register("slug")}
                      placeholder="medtronic"
                      className="h-12 border-muted-foreground/20 rounded-xl font-mono text-sm bg-muted/30"
                    />
                    <p className="text-[10px] text-muted-foreground font-medium">Leave empty for auto-generation</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">About the Manufacturer</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Describe the company, its heritage and product focus..."
                    rows={4}
                    className="border-muted-foreground/20 rounded-xl py-4 min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo_url" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Logo Image URL</Label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="logo_url"
                        {...form.register("logo_url")}
                        placeholder="https://cloud.cdn/logo.png"
                        className="pl-10 h-12 border-muted-foreground/20 rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website_url" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Official Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website_url"
                        {...form.register("website_url")}
                        placeholder="https://medtronic.com"
                        className="pl-10 h-12 border-muted-foreground/20 rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-muted-foreground/10">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="is_active" className="text-sm font-bold">Brand Status</Label>
                    <p className="text-xs text-muted-foreground font-medium">Inactive brands are hidden from storefront filters</p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={form.watch("is_active")}
                    onCheckedChange={(checked) => form.setValue("is_active", checked)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>

              <DialogFooter className="p-8 bg-muted/30 border-t gap-3 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingBrand(null);
                    form.reset();
                  }}
                  className="h-12 px-8 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="h-12 px-8 rounded-xl font-black shadow-lg shadow-primary/20">
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingBrand ? "Update Profile" : "Create Brand"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
