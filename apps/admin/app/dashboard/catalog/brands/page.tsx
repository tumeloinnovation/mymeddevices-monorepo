"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Tag,
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

interface BrandInfo {
  name: string;
  productCount: number;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchBrands = async () => {
    setLoading(true);
    try {
      // Fetch all products to extract unique brands
      const response = await catalogService.getVendorProducts({
        page: 1,
        page_size: 1000, // Get all products
      });

      if (!response?.products || !Array.isArray(response.products)) {
        console.error("Invalid response from API:", response);
        toast.error("Invalid data received from API");
        setBrands([]);
        return;
      }

      // Extract unique brands with counts
      const brandMap = new Map<string, number>();
      response.products.forEach((product) => {
        if (product?.brand && typeof product.brand === 'string') {
          const brandStr = String(product.brand).trim();
          if (brandStr) {
            const normalizedBrand = brandStr.toLowerCase();
            const currentCount = brandMap.get(normalizedBrand) || 0;
            brandMap.set(normalizedBrand, currentCount + 1);
          }
        }
      });

      // Convert to array and sort by product count
      const brandArray = Array.from(brandMap.entries())
        .map(([name, count]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
          productCount: count,
        }))
        .sort((a, b) => b.productCount - a.productCount);

      setBrands(brandArray);
    } catch (error) {
      console.error("Failed to load brands:", error);
      toast.error("Failed to load brands");
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
            <p className="text-muted-foreground">
              Manage product brands in the catalog.
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
                  placeholder="Search brands..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brands Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Brands
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({brands.length} total)
              </span>
            </CardTitle>
            <CardDescription>
              Brands extracted from product listings. Brands are managed through
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
            ) : filteredBrands.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No brands found</h3>
                <p className="text-muted-foreground">
                  {search
                    ? "Try adjusting your search"
                    : "Brands will appear here when products are added with brand information"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand Name</TableHead>
                      <TableHead className="text-right">Products</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrands.map((brand) => (
                      <TableRow key={brand.name}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Tag className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{String(brand.name)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{String(brand.productCount)}</Badge>
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
                                String(brand.name)
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
      </div>
    </DashboardLayout>
  );
}
