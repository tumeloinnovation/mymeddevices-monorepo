'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import * as z from 'zod';
import {
  ArrowLeft,
  Loader2,
  Upload,
  X,
  Send,
  Globe,
  Archive,
  RotateCcw,
  ImageIcon,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useProduct, useCategories } from '@/lib/api/hooks/useCatalog';
import { catalogApi } from '@/lib/api/endpoints/catalog';
import { cn } from '@/lib/utils';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  category_id: z.string().min(1, 'Please select a category'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  compare_at_price: z.coerce.number().min(0).optional(),
  cost_price: z.coerce.number().min(0).optional(),
  stock_quantity: z.coerce.number().min(0, 'Stock must be at least 0'),
  low_stock_threshold: z.coerce.number().min(0).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  status: z.enum(['draft', 'pending_review', 'published', 'archived']),
});

type ProductFormValues = z.infer<typeof productSchema>;

const statusBadgeClass: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  pending_review: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-200 text-slate-600',
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: product, loading: productLoading, error: productError, refetch: refetchProduct } = useProduct(id);
  const { data: categories, loading: categoriesLoading } = useCategories();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: standardSchemaResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      category_id: '',
      price: 0,
      compare_at_price: 0,
      cost_price: 0,
      stock_quantity: 0,
      low_stock_threshold: 5,
      description: '',
      status: 'draft',
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || '',
        sku: product.sku || '',
        category_id: product.category_id || '',
        price: product.price || 0,
        compare_at_price: product.compare_at_price || 0,
        cost_price: product.cost_price || 0,
        stock_quantity: product.stock_quantity ?? 0,
        low_stock_threshold: product.low_stock_threshold || 5,
        description: product.description || '',
        status: product.status as ProductFormValues['status'] || 'draft',
      });
    }
  }, [product, form]);

  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true);
    try {
      await catalogApi.updateProduct(id, {
        name: data.name,
        sku: data.sku.toUpperCase(),
        description: data.description,
        price: data.price,
        compare_at_price: data.compare_at_price || undefined,
        cost_price: data.cost_price || undefined,
        category_id: data.category_id,
        track_inventory: true,
        stock_quantity: data.stock_quantity,
        low_stock_threshold: data.low_stock_threshold || 5,
        status: data.status,
      });
      toast.success('Product updated successfully');
      router.push('/vendor/products');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImageUpload() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await catalogApi.uploadProductImage(id, selectedFile);
      toast.success('Image uploaded successfully');
      setSelectedFile(null);
      setImagePreview(null);
      refetchProduct();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  const handleLifecycleAction = async (action: string) => {
    setActionLoading(action);
    try {
      switch (action) {
        case 'verify':
          await catalogApi.verifyProduct(id);
          toast.success('Product submitted for review');
          break;
        case 'publish':
          await catalogApi.publishProduct(id);
          toast.success('Product published to storefront');
          break;
        case 'archive':
          await catalogApi.archiveProduct(id);
          toast.success('Product archived');
          break;
        case 'unarchive':
          await catalogApi.unarchiveProduct(id);
          toast.success('Product restored to draft');
          break;
      }
      refetchProduct();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (productLoading || categoriesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/vendor/products">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
          </Link>
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          <h2 className="font-semibold">Failed to load product details</h2>
          <p className="text-sm mt-1 text-red-600">{productError?.message || 'Product not found'}</p>
        </div>
      </div>
    );
  }

  const s = product.status || 'draft';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/vendor/products')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
              <Badge className={cn('text-[10px] px-2 py-0.5 font-medium', statusBadgeClass[s])}>
                {s.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">SKU: {product.sku} &middot; ID: {product.id.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {s === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLifecycleAction('verify')}
              disabled={!!actionLoading}
            >
              {actionLoading === 'verify' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit for Review
            </Button>
          )}
          {s === 'pending_review' && (
            <Button
              size="sm"
              onClick={() => handleLifecycleAction('publish')}
              disabled={!!actionLoading}
            >
              {actionLoading === 'publish' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Globe className="mr-2 h-4 w-4" />
              )}
              Publish
            </Button>
          )}
          {s === 'published' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLifecycleAction('archive')}
              disabled={!!actionLoading}
            >
              {actionLoading === 'archive' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Archive className="mr-2 h-4 w-4" />
              )}
              Archive
            </Button>
          )}
          {s === 'archived' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLifecycleAction('unarchive')}
              disabled={!!actionLoading}
            >
              {actionLoading === 'unarchive' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Restore to Draft
            </Button>
          )}
          {s === 'published' && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/products/${product.slug}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Storefront
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Form {...form}>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Product Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="SKU" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your medical device, safety specifications, and standard usages..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (KES)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step={0.01} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="compare_at_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compare at Price (KES)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cost_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Price (KES)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="stock_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stock</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="low_stock_threshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Threshold</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Organization & Status</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={categoriesLoading ? 'Loading...' : 'Select a category'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft (Hidden)</SelectItem>
                            <SelectItem value="pending_review">Pending Review</SelectItem>
                            <SelectItem value="published">Published (Visible)</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push('/vendor/products')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.images && product.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {product.images.map((img) => (
                      <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden ring-1 ring-slate-200">
                        <Image
                          src={img.url}
                          alt={img.alt_text || ''}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  {imagePreview ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden ring-1 ring-slate-200">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-white/80 shadow-sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setImagePreview(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-slate-400 transition-colors">
                      <ImageIcon className="h-6 w-6 text-slate-300" />
                      <span className="text-xs text-slate-500">Add image</span>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  )}
                  {selectedFile && (
                    <Button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={uploading}
                      size="sm"
                    >
                      {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload Image
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {(s === 'draft' && product.rejection_reason) && (
              <Card className="border-rose-200 bg-rose-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-rose-700">Rejection Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-rose-600">{product.rejection_reason}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Form>
    </div>
  );
}
