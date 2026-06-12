"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Tag as TagIcon,
  Package,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { catalogService, Product } from "@mymeddevices/shared-core";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface TagInfo {
  name: string;
  productCount: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchTags = async () => {
    setLoading(true);
    try {
      // Fetch all products to extract unique tags
      const response = await catalogService.getVendorProducts({
        page: 1,
        page_size: 1000, // Get all products
      });

      if (!response?.products || !Array.isArray(response.products)) {
        console.error("Invalid response from API:", response);
        toast.error("Invalid data received from API");
        setTags([]);
        return;
      }

      // Extract unique tags with counts
      const tagMap = new Map<string, number>();
      response.products.forEach((product) => {
        if (product?.tags && Array.isArray(product.tags) && product.tags.length > 0) {
          product.tags.forEach((tag) => {
            if (tag && typeof tag === 'string') {
              const tagStr = String(tag).trim();
              if (tagStr) {
                const normalizedTag = tagStr.toLowerCase();
                const currentCount = tagMap.get(normalizedTag) || 0;
                tagMap.set(normalizedTag, currentCount + 1);
              }
            }
          });
        }
      });

      // Convert to array and sort by product count
      const tagArray = Array.from(tagMap.entries())
        .map(([name, count]) => ({
          name, // Keep original case (already lowercased from normalization)
          productCount: count,
        }))
        .sort((a, b) => b.productCount - a.productCount);

      setTags(tagArray);
    } catch (error) {
      console.error("Failed to load tags:", error);
      toast.error("Failed to load tags");
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
            <p className="text-muted-foreground">
              Manage product tags in the catalog.
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Tags
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({tags.length} total)
              </span>
            </CardTitle>
            <CardDescription>
              Tags extracted from product listings. Tags are managed through
              product edit pages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <TagIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tags found</h3>
                <p className="text-muted-foreground">
                  {search
                    ? "Try adjusting your search"
                    : "Tags will appear here when products are added with tag information"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tag Name</TableHead>
                      <TableHead className="text-right">Products</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTags.map((tag) => (
                      <TableRow key={tag.name}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="font-medium">
                              {String(tag.name)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{String(tag.productCount)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-muted-foreground"
                          >
                            <Link
                              href={`/dashboard/catalog/products?search=${encodeURIComponent(
                                String(tag.name)
                              )}`}
                            >
                              View Products
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Tags Cloud */}
        {tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Popular Tags</CardTitle>
              <CardDescription>
                Most used tags across the catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 20).map((tag) => (
                  <Badge
                    key={tag.name}
                    variant={tag.productCount > 5 ? "default" : "secondary"}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    asChild
                  >
                    <Link
                      href={`/dashboard/catalog/products?search=${encodeURIComponent(
                        String(tag.name)
                      )}`}
                    >
                      {String(tag.name)} ({String(tag.productCount)})
                    </Link>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
