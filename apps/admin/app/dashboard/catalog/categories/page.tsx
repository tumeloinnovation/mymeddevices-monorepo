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
  Info
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
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

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
    setParentId(undefined); // parent_id is not directly editable in this simple UI yet
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
        toast.success("Category updated");
      } else {
        await catalogService.createCategory({
          name,
          slug,
          description,
          parent_id: parentId,
          is_active: isActive,
          sort_order: 0
        });
        toast.success("Category created");
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
    if (!confirm("Are you sure you want to delete this category? This will fail if there are products or sub-categories.")) return;
    try {
      await catalogService.deleteCategory(id);
      toast.success("Category deleted");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Catalog Management</h1>
            <p className="text-muted-foreground">
              Manage product categories and taxonomy tree.
            </p>
          </div>
          <Button onClick={() => openCreateDialog()}>
            <Plus className="size-4 mr-2" />
            New Root Category
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Category Taxonomy</CardTitle>
              <CardDescription>Hierarchical view of all active and inactive categories.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <FolderTree className="size-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No categories defined yet.</p>
                  <Button variant="link" onClick={() => openCreateDialog()}>Create your first category</Button>
                </div>
              ) : (
                <div className="space-y-1">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Taxonomy Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 flex gap-3">
                <Info className="size-5 shrink-0" />
                <div className="space-y-2">
                  <p className="font-semibold">Best Practices:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Keep names clear and professional.</li>
                    <li>Use slugs for SEO-friendly URLs.</li>
                    <li>Inactivating a category hides all its products.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
                <DialogDescription>
                  {parentId ? "Adding a sub-category." : "Adding a top-level category."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cat-name">Name</Label>
                  <Input 
                    id="cat-name" 
                    value={name} 
                    onChange={(e) => generateSlug(e.target.value)} 
                    placeholder="Diagnostics"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-slug">Slug (URL path)</Label>
                  <Input 
                    id="cat-slug" 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)} 
                    placeholder="diagnostics"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-desc">Description</Label>
                  <Textarea 
                    id="cat-desc" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Medical diagnostic equipment..."
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch 
                    id="cat-active" 
                    checked={isActive} 
                    onCheckedChange={setIsActive} 
                  />
                  <Label htmlFor="cat-active">Category is active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
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
  const [isExpanded, setIsExpanded] = useState(level < 1); // Expand top level by default
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center group py-2 px-2 hover:bg-muted/50 rounded-md transition-colors">
        <div style={{ paddingLeft: `${level * 20}px` }} className="flex items-center flex-1">
          {hasChildren ? (
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-0.5 hover:bg-muted rounded mr-1">
              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
          ) : (
            <div className="size-4 mr-1" />
          )}
          <FolderTree className="size-4 mr-2 text-muted-foreground" />
          <span className={`font-medium ${!category.is_active ? "text-muted-foreground line-through" : ""}`}>
            {category.name}
          </span>
          <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            /{category.slug}
          </span>
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Edit className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddChild(category.id)}>
                <FolderPlus className="size-4 mr-2" />
                Add Sub-category
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(category.id)}>
                <Trash2 className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="mt-1">
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
