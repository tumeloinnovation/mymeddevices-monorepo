"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  FolderTree, 
  ChevronRight, 
  ChevronDown, 
  Edit, 
  Trash2, 
  MoreVertical,
  Loader2,
  FolderPlus,
  Info,
  LayoutDashboard,
  ChevronRight as ChevronRightIcon,
  Search,
  Filter,
  Eye,
  Settings2,
  Boxes,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import {
  catalogService,
  CategoryTree,
  CategoryCreate,
  CategoryUpdate
} from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTree | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  
  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await catalogService.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateDialog = (pid?: string) => {
    setEditingCategory(null);
    setParentId(pid);
    setName("");
    setSlug("");
    setDescription("");
    setIsActive(true);
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: CategoryTree) => {
    setEditingCategory(category);
    setParentId(undefined);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setIsActive(category.is_active);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await catalogService.updateCategory(editingCategory.id, {
          name,
          slug,
          description,
          is_active: isActive
        });
        toast.success("Category updated successfully");
      } else {
        await catalogService.createCategory({
          name,
          slug,
          description,
          parent_id: parentId,
          is_active: isActive,
          sort_order: 0
        });
        toast.success("Category created successfully");
      }
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await catalogService.deleteCategory(id);
      toast.success("Category deleted");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    }
  };

  const totalCategories = React.useMemo(() => {
    let count = 0;
    const countNodes = (nodes: CategoryTree[]) => {
      nodes.forEach(n => {
        count++;
        if (n.children?.length) countNodes(n.children);
      });
    };
    countNodes(categories);
    return count;
  }, [categories]);

  const activeCategories = React.useMemo(() => {
    let count = 0;
    const countNodes = (nodes: CategoryTree[]) => {
      nodes.forEach(n => {
        if (n.is_active) count++;
        if (n.children?.length) countNodes(n.children);
      });
    };
    countNodes(categories);
    return count;
  }, [categories]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-[1600px] mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <ChevronRightIcon className="h-3 w-3" />
          <Link href="/dashboard/catalog" className="hover:text-primary transition-colors">
            Catalog
          </Link>
          <ChevronRightIcon className="h-3 w-3" />
          <span className="font-medium text-foreground">Categories</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b pb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Category Taxonomy</h1>
            <p className="text-muted-foreground text-base mt-2">
              Organize your medical equipment into a logical hierarchical structure.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-11 px-6 shadow-sm">
              <Boxes className="mr-2 h-4 w-4" />
              Manage Layout
            </Button>
            <Button className="h-11 px-6 shadow-md shadow-primary/20" onClick={() => openCreateDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              New Root Category
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Tree View */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <Card className="shadow-xl shadow-foreground/5 border-muted/50 overflow-hidden">
              <CardHeader className="bg-muted/30 border-b p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Taxonomy Tree</CardTitle>
                    <CardDescription className="text-sm">Drag and drop to reorder (Coming soon)</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Find category..." className="pl-10 w-[240px] bg-background" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground font-medium">Building taxonomy tree...</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-3xl">
                    <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                      <FolderTree className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-xl font-bold">No categories yet</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                      Start your catalog structure by creating your first top-level category.
                    </p>
                    <Button variant="secondary" className="mt-6" onClick={() => openCreateDialog()}>
                      Create first category
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <CategoryItem 
                        key={cat.id} 
                        category={cat} 
                        onEdit={openEditDialog}
                        onAddChild={openCreateDialog}
                        onDelete={handleDeleteCategory}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Insights */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card className="shadow-lg border-muted/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Taxonomy Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total Categories</span>
                  <Badge variant="secondary" className="font-bold text-sm">{totalCategories}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Active Nodes</span>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-bold text-sm">{activeCategories}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Root Categories</span>
                  <Badge variant="outline" className="font-bold text-sm border-primary/30 text-primary">{categories.length}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-muted/50 bg-primary/5 border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Structure Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                    <p><span className="font-bold text-foreground">Flat is Better:</span> Aim for no more than 3 levels of depth for optimal user navigation.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                    <p><span className="font-bold text-foreground">SEO Slugs:</span> Keep slugs short, descriptive, and keyword-rich for better search ranking.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                    <p><span className="font-bold text-foreground">Visibility:</span> Deactivating a category hides it from the store but preserves product associations.</p>
                  </div>
                </div>
                <Button variant="link" className="p-0 h-auto text-primary font-bold mt-4" asChild>
                  <Link href="/dashboard/system">
                    Full Documentation <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[550px] rounded-3xl p-0 overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="p-8 bg-muted/30 border-b">
                <DialogHeader>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-inner">
                    <Boxes className="h-7 w-7" />
                  </div>
                  <DialogTitle className="text-2xl font-black">{editingCategory ? "Update Category" : "New Category"}</DialogTitle>
                  <DialogDescription className="text-sm pt-1">
                    {parentId ? "Adding a sub-category to an existing branch." : "Adding a new root category to the catalog structure."}
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <div className="grid gap-6 p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cat-name" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Category Name</Label>
                    <Input 
                      id="cat-name" 
                      value={name} 
                      onChange={(e) => generateSlug(e.target.value)} 
                      placeholder="e.g. Diagnostics"
                      required
                      className="h-12 text-base font-medium border-muted-foreground/20 rounded-xl focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cat-slug" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">URL Path (Slug)</Label>
                    <Input 
                      id="cat-slug" 
                      value={slug} 
                      onChange={(e) => setSlug(e.target.value)} 
                      placeholder="diagnostics"
                      required
                      className="h-12 border-muted-foreground/20 rounded-xl font-mono text-sm bg-muted/30"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cat-desc" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Public Description</Label>
                  <Textarea 
                    id="cat-desc" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Describe what kind of medical equipment belongs in this category..."
                    className="min-h-[100px] border-muted-foreground/20 rounded-xl py-4"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-muted-foreground/10">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="cat-active" className="text-sm font-bold">Category Status</Label>
                    <p className="text-xs text-muted-foreground font-medium">Toggle visibility on the storefront</p>
                  </div>
                  <Switch 
                    id="cat-active" 
                    checked={isActive} 
                    onCheckedChange={setIsActive} 
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
              
              <DialogFooter className="p-8 bg-muted/30 border-t gap-3 sm:gap-0">
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)} disabled={saving} className="h-12 px-8 rounded-xl font-bold">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="h-12 px-8 rounded-xl font-black shadow-lg shadow-primary/20">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCategory ? "Update Category" : "Create Category"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function CategoryItem({ 
  category, 
  level = 0, 
  onEdit, 
  onAddChild,
  onDelete
}: { 
  category: CategoryTree, 
  level?: number,
  onEdit: (cat: CategoryTree) => void,
  onAddChild: (pid: string) => void,
  onDelete: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="flex flex-col">
      <div className={`flex items-center group py-2 px-4 transition-all duration-200 rounded-2xl border border-transparent hover:border-muted-foreground/10 hover:bg-muted/30 ${!category.is_active ? "opacity-60" : ""}`}>
        <div style={{ paddingLeft: `${level * 24}px` }} className="flex items-center flex-1 min-w-0">
          {hasChildren ? (
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="p-1.5 hover:bg-muted rounded-lg mr-2 text-muted-foreground transition-colors"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-9 mr-1" />
          )}
          
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center mr-4 shrink-0 transition-colors ${category.is_active ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white shadow-sm" : "bg-muted text-muted-foreground"}`}>
            {level === 0 ? <Boxes className="h-5 w-5" /> : <FolderTree className="h-4 w-4" />}
          </div>
          
          <div className="flex flex-col min-w-0">
            <span className={`text-base font-bold truncate ${!category.is_active ? "text-muted-foreground italic" : "text-foreground group-hover:text-primary transition-colors"}`}>
              {category.name}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-muted-foreground bg-muted px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                /{category.slug}
              </span>
              {!category.is_active && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-500/30 text-amber-600 bg-amber-50">Inactive</Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => onAddChild(category.id)}>
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => onEdit(category)}>
            <Edit className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-xl border-muted">
              <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-2 py-1.5">Manage Node</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(category)} className="rounded-lg py-2.5">
                <Edit className="h-4 w-4 mr-3" /> Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddChild(category.id)} className="rounded-lg py-2.5">
                <FolderPlus className="h-4 w-4 mr-3" /> Add Child
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg py-2.5" asChild>
                <Link href={`/dashboard/catalog/products?category=${category.id}`}>
                  <Boxes className="h-4 w-4 mr-3" /> View Products
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/5 rounded-lg py-2.5" onClick={() => onDelete(category.id)}>
                <Trash2 className="h-4 w-4 mr-3" /> Delete Node
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="mt-2 ml-4 border-l-2 border-muted/50 pl-4 space-y-1">
          {category.children.map((child) => (
            <CategoryItem 
              key={child.id} 
              category={child} 
              level={level + 1} 
              onEdit={onEdit} 
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
