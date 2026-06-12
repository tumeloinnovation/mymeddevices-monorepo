"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderTree,
  Package,
  ArrowRight,
  Plus,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { catalogService } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@mymeddevices/shared-ui";

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href: string;
  description: string;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const statCardsConfig: Omit<StatCard, "value">[] = [
  {
    title: "Total Categories",
    icon: <FolderTree className="h-5 w-5 text-blue-500" />,
    href: "/dashboard/catalog/categories",
    description: "Active product categories",
  },
  {
    title: "Total Products",
    icon: <Package className="h-5 w-5 text-green-500" />,
    href: "/dashboard/catalog/products",
    description: "All product listings",
  },
  {
    title: "Pending Review",
    icon: <Clock className="h-5 w-5 text-yellow-500" />,
    href: "/dashboard/catalog/products",
    description: "Awaiting verification",
  },
  {
    title: "Published Products",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    href: "/dashboard/catalog/products",
    description: "Live on storefront",
  },
];

const quickActions: QuickAction[] = [
  {
    title: "Add Root Category",
    description: "Create a new top-level category",
    href: "/dashboard/catalog/categories",
    icon: <Plus className="h-5 w-5" />,
  },
  {
    title: "Add Product",
    description: "Create a new product listing",
    href: "/dashboard/catalog/products/new",
    icon: <Package className="h-5 w-5" />,
  },
];

interface CatalogStats {
  categories: number;
  totalProducts: number;
  pendingReview: number;
  published: number;
}

export default function CatalogOverviewPage() {
  const [stats, setStats] = useState<CatalogStats>({
    categories: 0,
    totalProducts: 0,
    pendingReview: 0,
    published: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        // Fetch categories
        const categories = await catalogService.getCategories();
        const categoryCount = categories.length;

        // Fetch products by status
        const [allProducts, pendingProducts, publishedProducts] = await Promise.all([
          catalogService.getVendorProducts({ page: 1, page_size: 1 }),
          catalogService.getVendorProducts({ status_filter: "pending_review", page: 1, page_size: 1 }),
          catalogService.getVendorProducts({ status_filter: "published", page: 1, page_size: 1 }),
        ]);

        setStats({
          categories: categoryCount,
          totalProducts: allProducts.total,
          pendingReview: pendingProducts.total,
          published: publishedProducts.total,
        });
      } catch (error) {
        console.error("Failed to load stats:", error);
        toast.error("Failed to load catalog statistics");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const getStatValue = (title: string): number => {
    if (loading) return 0;

    switch (title) {
      case "Total Categories":
        return stats.categories;
      case "Total Products":
        return stats.totalProducts;
      case "Pending Review":
        return stats.pendingReview;
      case "Published Products":
        return stats.published;
      default:
        return 0;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Catalog Management</h1>
            <p className="text-muted-foreground">
              Manage product categories, inventory, and storefront content.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/catalog/categories">
                <FolderTree className="mr-2 h-4 w-4" />
                Manage Categories
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/catalog/products">
                <Package className="mr-2 h-4 w-4" />
                View Products
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCardsConfig.map((card) => {
            const value = getStatValue(card.title);
            return (
              <Link key={card.title} href={card.href} className="group">
                <Card className="transition-all hover:shadow-md hover:border-primary/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    {card.icon}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        value.toLocaleString()
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="transition-all hover:shadow-md group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        action.variant === "destructive"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                      )}>
                        {action.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {action.description}
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity / Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Start Guide</CardTitle>
              <CardDescription>Get started with catalog management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  1
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Set up categories</p>
                  <p className="text-sm text-muted-foreground">
                    Create your product category taxonomy (e.g., Diagnostics, BP Monitors)
                  </p>
                  <Button variant="link" className="p-0 h-auto" asChild>
                    <Link href="/dashboard/catalog/categories">Go to Categories →</Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  2
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Add products</p>
                  <p className="text-sm text-muted-foreground">
                    Create product listings with images, pricing, and specifications
                  </p>
                  <Button variant="link" className="p-0 h-auto" asChild>
                    <Link href="/dashboard/catalog/products">Go to Products →</Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  3
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Review and publish</p>
                  <p className="text-sm text-muted-foreground">
                    Verify product completeness and publish to storefront
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Management Tips</CardTitle>
              <CardDescription>Best practices for catalog management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p>Always categorize products for better discoverability</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p>Review products before publishing to ensure completeness</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p>Use high-quality images to showcase products effectively</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p>Keep pricing and stock information up to date</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
