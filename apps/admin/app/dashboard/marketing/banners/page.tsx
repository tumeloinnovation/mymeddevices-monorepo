"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, MoreVertical, Edit, Trash, Play, Pause, Loader2, Image as ImageIcon, Layout, Eye, MousePointerClick } from "lucide-react";
import { shoppingService, Banner, BannerPlacement, BannerStatus } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PLACEMENT_LABELS: Record<string, string> = {
  homepage_hero: "Homepage Hero",
  homepage_sidebar: "Homepage Sidebar",
  category_page: "Category Page",
  product_page: "Product Page",
  checkout_page: "Checkout Page",
  header_bar: "Header Announcement Bar",
  footer: "Footer",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/20",
  scheduled: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20",
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  paused: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  expired: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20",
};

export default function MarketingBannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterPlacement, setFilterPlacement] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadBanners = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterPlacement !== "all") params.placement = filterPlacement;
      if (filterStatus !== "all") params.status = filterStatus;

      const data = await shoppingService.getBanners(params);
      setBanners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load banners", error);
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, [filterPlacement, filterStatus]);

  const filteredBanners = banners.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeBannersCount = banners.filter(b => b.status === "active").length;
  const totalImpressions = banners.reduce((sum, b) => sum + (b.impressions || (b as any).impressions_count || 0), 0);
  const totalClicks = banners.reduce((sum, b) => sum + (b.clicks || (b as any).clicks_count || 0), 0);

  const handleActivate = async (banner: Banner) => {
    setActionLoading(banner.id);
    try {
      await shoppingService.activateBanner(banner.id);
      toast.success("Banner activated");
      loadBanners();
    } catch (error: any) {
      toast.error("Failed to activate banner");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePause = async (banner: Banner) => {
    setActionLoading(banner.id);
    try {
      await shoppingService.pauseBanner(banner.id);
      toast.success("Banner paused");
      loadBanners();
    } catch (error: any) {
      toast.error("Failed to pause banner");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm(`Are you sure you want to delete banner "${banner.title}"?`)) return;
    setActionLoading(banner.id);
    try {
      await shoppingService.deleteBanner(banner.id);
      toast.success("Banner deleted");
      loadBanners();
    } catch (error: any) {
      toast.error("Failed to delete banner");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hero & Promotional Banners</h1>
            <p className="text-muted-foreground text-sm">
              Manage website announcements, hero slider cards, category banners, and placement scheduling.
            </p>
          </div>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/dashboard/marketing/banners/new">
              <Plus className="mr-2 h-4 w-4" /> Add New Banner
            </Link>
          </Button>
        </div>

        {/* Analytics Header Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Banners</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : banners.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Configured banner assets</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Active Banners</CardTitle>
              <Layout className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{loading ? "..." : activeBannersCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Live on store portal</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{loading ? "..." : totalImpressions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Banner impressions recorded</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Clicks</CardTitle>
              <MousePointerClick className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{loading ? "..." : totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Buyer click engagement</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search banner title or subtitle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={filterPlacement} onValueChange={setFilterPlacement}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Placement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Placements</SelectItem>
                    <SelectItem value="homepage_hero">Homepage Hero</SelectItem>
                    <SelectItem value="homepage_sidebar">Homepage Sidebar</SelectItem>
                    <SelectItem value="category_page">Category Page</SelectItem>
                    <SelectItem value="header_bar">Header Bar</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title & Subtitle</TableHead>
                    <TableHead>Placement</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredBanners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No promotional banners found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBanners.map((banner) => (
                      <TableRow key={banner.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="font-semibold text-foreground">{banner.title}</div>
                          {banner.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{banner.description}</p>
                          )}
                          {(banner.cta_link || (banner as any).target_url) && (
                            <p className="text-xs font-mono text-primary truncate max-w-[200px]">→ {banner.cta_link || (banner as any).target_url}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-normal">
                            {PLACEMENT_LABELS[banner.placement] || banner.placement}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold">
                          #{banner.priority || 0}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div><span className="font-semibold text-foreground">{banner.impressions || (banner as any).impressions_count || 0}</span> views</div>
                          <div><span className="font-semibold text-foreground">{banner.clicks || (banner as any).clicks_count || 0}</span> clicks</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[banner.status] || STATUS_COLORS.draft}>
                            {banner.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={actionLoading === banner.id}>
                                {actionLoading === banner.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/marketing/banners/${banner.id}`)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Banner
                              </DropdownMenuItem>
                              {banner.status !== "active" ? (
                                <DropdownMenuItem onClick={() => handleActivate(banner)}>
                                  <Play className="mr-2 h-4 w-4 text-emerald-500" /> Set Active
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handlePause(banner)}>
                                  <Pause className="mr-2 h-4 w-4 text-amber-500" /> Pause Banner
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(banner)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" /> Delete Banner
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
