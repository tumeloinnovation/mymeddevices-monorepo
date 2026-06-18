"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Tags as TagIcon,
  LayoutDashboard,
  ChevronRight,
  Download,
  ArrowUpRight,
  MoreVertical,
  Activity,
  CheckCircle2,
  XCircle,
  Hash,
  Palette,
} from "lucide-react";
import { catalogService, Tag } from "@mymeddevices/shared-core";
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
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";

const tagFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

type TagFormData = z.infer<typeof tagFormSchema>;

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const form = useForm<TagFormData>({
    resolver: standardSchemaResolver(tagFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      color: "#3b82f6",
      is_active: true,
    },
  });

  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await catalogService.getTags({
        active_only: false,
        page,
        page_size: pageSize,
      });

      if (response?.tags) {
        setTags(response.tags);
        setTotal(response.total);
      }
    } catch (error) {
      console.error("Failed to load tags:", error);
      toast.error("Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [page]);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (data: TagFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        slug: data.slug || undefined,
        color: data.color || undefined,
      };

      if (editingTag) {
        await catalogService.updateTag(editingTag.id, payload);
        toast.success("Tag updated successfully");
      } else {
        await catalogService.createTag(payload);
        toast.success("New tag created");
      }

      setDialogOpen(false);
      setEditingTag(null);
      form.reset();
      fetchTags();
    } catch (error) {
      console.error("Failed to save tag:", error);
      toast.error(editingTag ? "Failed to update tag" : "Failed to create tag");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    form.reset({
      name: tag.name,
      slug: tag.slug,
      color: tag.color || "#3b82f6",
      is_active: tag.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (tag: Tag) => {
    try {
      await catalogService.deleteTag(tag.id);
      toast.success("Tag removed");
      fetchTags();
    } catch (error) {
      console.error("Failed to delete tag:", error);
      toast.error("Failed to delete tag. Ensure it's not being used by products.");
    }
  };

  const openCreateDialog = () => {
    setEditingTag(null);
    form.reset({
      name: "",
      slug: "",
      color: "#3b82f6",
      is_active: true,
    });
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-bold">
          <Link href="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/dashboard/catalog" className="hover:text-primary transition-colors">
            Catalog
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-bold text-foreground">Tags</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Organization Tags</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">
              Use tags to label, group, and filter products across the storefront.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-10 px-5 shadow-sm text-sm font-bold rounded-xl">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="h-10 px-6 shadow-md shadow-primary/20 text-sm font-black rounded-xl" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Tag
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Tags List */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="shadow-xl shadow-foreground/5 border-muted/50 overflow-hidden rounded-3xl">
              <CardHeader className="bg-muted/20 border-b p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold">Manage Tags</CardTitle>
                    <CardDescription className="text-sm font-medium">Showing {filteredTags.length} tags</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Search tags..." 
                      className="pl-9 w-full sm:w-[240px] bg-background h-9 rounded-xl text-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : filteredTags.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                      <TagIcon className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">No tags found</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm text-sm font-medium">
                      {search ? "No results match your search query." : "Start by adding your first organizational tag."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30 border-y">
                        <TableRow>
                          <TableHead className="w-[350px] font-black text-foreground text-[10px] uppercase tracking-widest px-6 py-3">TAG IDENTITY</TableHead>
                          <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-3">PRODUCTS</TableHead>
                          <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-3">STATUS</TableHead>
                          <TableHead className="text-right font-black text-foreground text-[10px] uppercase tracking-widest px-6 py-3">ACTIONS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTags.map((tag) => (
                          <TableRow key={tag.id} className="group hover:bg-muted/30 transition-all border-b last:border-0">
                            <TableCell className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="h-9 w-9 flex-shrink-0 rounded-xl shadow-sm border-2 border-background ring-1 ring-muted"
                                  style={{ backgroundColor: tag.color || "#3b82f6" }}
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate max-w-[200px] font-bold text-foreground text-base group-hover:text-primary transition-colors">
                                    {tag.name}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded w-fit mt-0.5 uppercase">
                                    /{tag.slug}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-black text-sm">{tag.product_count}</span>
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tagged</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {tag.is_active ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2 py-0.5 flex items-center w-fit gap-1 text-[10px] rounded-lg">
                                  <CheckCircle2 className="h-3 w-3" />
                                  ACTIVE
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="font-bold px-2 py-0.5 flex items-center w-fit gap-1 text-[10px] rounded-lg">
                                  <XCircle className="h-3 w-3" />
                                  DISABLED
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right px-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted-foreground/10 rounded-full">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-xl border-muted">
                                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 px-2 py-1.5">Options</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleEdit(tag)} className="rounded-xl py-2.5 cursor-pointer">
                                    <Edit className="h-4 w-4 mr-3" /> Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer">
                                    <Link href={`/dashboard/catalog/products?tag=${tag.name}`}>
                                      <Hash className="h-4 w-4 mr-3" /> Filter Products
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive focus:bg-destructive/5 rounded-xl py-2.5 cursor-pointer font-bold"
                                    onClick={() => handleDelete(tag)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-3" /> Delete Tag
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
                  <div className="flex items-center justify-between p-5 bg-muted/10 border-t">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      Page {page} of {Math.ceil(total / pageSize)}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 font-bold rounded-xl text-xs"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 font-bold rounded-xl text-xs"
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
            <Card className="shadow-lg border-muted/50 overflow-hidden rounded-3xl">
              <CardHeader className="bg-primary/5 border-b p-5">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Tag Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Tags</span>
                  <span className="text-2xl font-black">{total}</span>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-2xl border border-muted-foreground/10 flex flex-col gap-4">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">Quick Tips</span>
                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                    <p className="text-xs font-bold text-muted-foreground leading-relaxed">Use high-contrast colors for primary product categories.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                    <p className="text-xs font-bold text-muted-foreground leading-relaxed">Tags improve storefront search and SEO discovery.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10 flex flex-col gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10">
                  <TagIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Advanced Labeling</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 leading-relaxed">
                    Combine tags with categories for multidimensional filtering.
                  </p>
                </div>
                <Button variant="link" className="w-fit p-0 h-auto text-primary font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform" asChild>
                  <Link href="/dashboard/catalog">
                    CATALOG OVERVIEW <ArrowUpRight className="ml-1.5 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="p-8 bg-muted/30 border-b">
                <DialogHeader>
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-inner">
                    <Hash className="h-6 w-6" />
                  </div>
                  <DialogTitle className="text-2xl font-black tracking-tight">{editingTag ? "Edit Tag Details" : "New Catalog Tag"}</DialogTitle>
                  <DialogDescription className="text-sm font-medium pt-1">
                    Define tags to help categorize and discover products easily.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="grid gap-5 p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Display Name *</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="e.g. Surgical"
                      className="h-11 text-base font-bold border-muted-foreground/20 rounded-xl focus:ring-primary"
                    />
                    {form.formState.errors.name && (
                      <p className="text-[10px] font-bold text-destructive">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">URL Slug</Label>
                    <Input
                      id="slug"
                      {...form.register("slug")}
                      placeholder="surgical"
                      className="h-11 border-muted-foreground/20 rounded-xl font-mono text-xs bg-muted/30"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Visual Identity</Label>
                  <div className="flex items-center gap-5 p-3.5 bg-muted/20 rounded-2xl border border-muted-foreground/10">
                    <div className="relative group">
                      <Input
                        type="color"
                        id="color"
                        {...form.register("color")}
                        className="h-12 w-12 p-0 border-0 rounded-xl cursor-pointer shadow-lg overflow-hidden"
                      />
                      <Palette className="h-3.5 w-3.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none drop-shadow-md" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-black uppercase tracking-widest">Color Accent</span>
                      <p className="text-[10px] text-muted-foreground font-bold font-mono">{form.watch("color")}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-muted-foreground/10 mt-1">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="is_active" className="text-sm font-black">Tag Status</Label>
                    <p className="text-[10px] text-muted-foreground font-bold">Show in storefront filters</p>
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
                    setEditingTag(null);
                    form.reset();
                  }}
                  className="h-11 px-8 rounded-xl font-bold text-sm"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="h-11 px-8 rounded-xl font-black shadow-lg shadow-primary/20 text-sm">
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingTag ? "Update Tag" : "Create Tag"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
