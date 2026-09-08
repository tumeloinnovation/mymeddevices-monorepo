"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Star,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Trash2,
  Package,
  Store,
  User,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  RefreshCw,
  X,
  MessageSquare,
  Sparkles,
  Flag,
} from "lucide-react";
import {
  adminService,
  AdminReview,
  AdminReviewsSummary,
} from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type ModerationFilter = "all" | "visible" | "hidden" | "removed" | "flagged";
type VerifiedFilter = "all" | "verified" | "unverified";
type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";
type SortField = "created_at" | "rating" | "customer_name" | "product_name";
type SortOrder = "asc" | "desc";

export default function ReviewsManagementPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [summary, setSummary] = useState<AdminReviewsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Moderation / Inspection Dialog State
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [moderationReason, setModerationReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<AdminReview | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filters & Search State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ModerationFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Fetch reviews and summary from backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const [reviewsRes, summaryRes] = await Promise.allSettled([
        adminService.getReviews({
          moderation_status: statusFilter !== "flagged" ? statusFilter : undefined,
          contains_profanity: statusFilter === "flagged" ? true : undefined,
          page,
          limit: pageSize,
        }),
        adminService.getReviewsSummary(),
      ]);

      if (reviewsRes.status === "fulfilled" && reviewsRes.value) {
        setReviews(reviewsRes.value.reviews || []);
        setTotal(reviewsRes.value.total || 0);
      } else {
        console.error("Failed to load reviews:", reviewsRes);
      }

      if (summaryRes.status === "fulfilled" && summaryRes.value) {
        setSummary(summaryRes.value);
      }
    } catch (error) {
      console.error("Failed to fetch review data:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, statusFilter]);

  // Client-side filtering & sorting for search, rating, verified
  const filteredReviews = useMemo(() => {
    let list = [...reviews];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
          (r.customer_email && r.customer_email.toLowerCase().includes(q)) ||
          (r.product_name && r.product_name.toLowerCase().includes(q)) ||
          (r.vendor_name && r.vendor_name.toLowerCase().includes(q)) ||
          (r.comment && r.comment.toLowerCase().includes(q))
      );
    }

    if (ratingFilter !== "all") {
      const targetRating = parseInt(ratingFilter, 10);
      list = list.filter((r) => r.rating === targetRating);
    }

    if (verifiedFilter !== "all") {
      const isVerified = verifiedFilter === "verified";
      list = list.filter((r) => r.is_verified_purchase === isVerified);
    }

    // Sort
    list.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "rating":
          aVal = a.rating;
          bVal = b.rating;
          break;
        case "customer_name":
          aVal = (a.customer_name || a.customer_email || "").toLowerCase();
          bVal = (b.customer_name || b.customer_email || "").toLowerCase();
          break;
        case "product_name":
          aVal = (a.product_name || "").toLowerCase();
          bVal = (b.product_name || "").toLowerCase();
          break;
        case "created_at":
        default:
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [reviews, search, ratingFilter, verifiedFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setRatingFilter("all");
    setVerifiedFilter("all");
  };

  const hasActiveFilters =
    !!search ||
    statusFilter !== "all" ||
    ratingFilter !== "all" ||
    verifiedFilter !== "all";

  // Moderate review status
  const handleModerate = async (
    reviewId: string,
    newStatus: "visible" | "hidden" | "removed",
    reason?: string
  ) => {
    setIsUpdatingStatus(true);
    try {
      await adminService.moderateReview(reviewId, {
        moderation_status: newStatus,
        reason: reason || undefined,
      });

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                moderation_status: newStatus,
                moderation_reason: reason || r.moderation_reason,
              }
            : r
        )
      );

      if (selectedReview && selectedReview.id === reviewId) {
        setSelectedReview((prev) =>
          prev
            ? {
                ...prev,
                moderation_status: newStatus,
                moderation_reason: reason || prev.moderation_reason,
              }
            : null
        );
      }

      const statusLabels = {
        visible: "approved and published",
        hidden: "hidden from public store",
        removed: "marked as removed / spam",
      };

      toast.success(`Review ${statusLabels[newStatus]}`);
      fetchData();
    } catch (error: any) {
      console.error("Moderation failed:", error);
      toast.error(error.message || "Failed to moderate review");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Delete review
  const promptDeleteReview = (review: AdminReview) => {
    setReviewToDelete(review);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;
    setDeleting(true);
    try {
      await adminService.deleteReview(reviewToDelete.id);
      toast.success("Review permanently deleted");
      setDeleteDialogOpen(false);
      if (selectedReview?.id === reviewToDelete.id) {
        setDetailsDialogOpen(false);
      }
      setReviewToDelete(null);
      fetchData();
    } catch (error: any) {
      console.error("Failed to delete review:", error);
      toast.error(error.message || "Failed to delete review");
    } finally {
      setDeleting(false);
    }
  };

  const openInspectionModal = (review: AdminReview) => {
    setSelectedReview(review);
    setModerationReason(review.moderation_reason || "");
    setDetailsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Product Reviews Moderation
            </h1>
            <Badge variant="outline" className="text-xs font-medium">
              Customer Feedback & Trust
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Audit customer product ratings, verify clinical feedback, and moderate flagged or inappropriate reviews.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="default"
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Reviews"
          value={summary?.total_reviews ?? total}
          subtext="Total marketplace ratings"
          icon={<MessageSquare className="h-4 w-4 text-primary" />}
        />
        <StatCard
          label="Average Rating"
          value={summary?.average_rating ? `${summary.average_rating} / 5.0` : "0.0"}
          subtext="Overall product satisfaction"
          icon={<Star className="h-4 w-4 fill-amber-400 text-amber-500" />}
          highlight="active"
        />
        <StatCard
          label="Approved / Visible"
          value={summary?.visible_reviews ?? 0}
          subtext={
            summary?.total_reviews
              ? `${Math.round(((summary.visible_reviews ?? 0) / summary.total_reviews) * 100)}% published live`
              : "0% published"
          }
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        />
        <StatCard
          label="Flagged / Profanity"
          value={(summary?.flagged_profanity ?? 0) + (summary?.hidden_reviews ?? 0)}
          subtext={`${summary?.flagged_profanity ?? 0} profanity triggers`}
          icon={<ShieldAlert className="h-4 w-4 text-destructive" />}
          highlight={
            (summary?.flagged_profanity ?? 0) + (summary?.hidden_reviews ?? 0) > 0
              ? "warning"
              : undefined
          }
        />
      </div>

      {/* Advanced Filter & Search Bar */}
      <div className="bg-card p-3.5 rounded-xl border space-y-3 mb-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reviewer, product, vendor, comment text..."
              className="h-9 pl-9 pr-8 text-sm bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Dropdown Filters */}
          <div className="flex items-center gap-2">
            {/* Rating Filter */}
            <Select
              value={ratingFilter}
              onValueChange={(val) => setRatingFilter(val as RatingFilter)}
            >
              <SelectTrigger className="h-9 text-xs w-[135px] bg-background">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Ratings</SelectItem>
                <SelectItem value="5" className="text-xs">5 Stars ★★★★★</SelectItem>
                <SelectItem value="4" className="text-xs">4 Stars ★★★★☆</SelectItem>
                <SelectItem value="3" className="text-xs">3 Stars ★★★☆☆</SelectItem>
                <SelectItem value="2" className="text-xs">2 Stars ★★☆☆☆</SelectItem>
                <SelectItem value="1" className="text-xs">1 Star ★☆☆☆☆</SelectItem>
              </SelectContent>
            </Select>

            {/* Verified Buyer Filter */}
            <Select
              value={verifiedFilter}
              onValueChange={(val) => setVerifiedFilter(val as VerifiedFilter)}
            >
              <SelectTrigger className="h-9 text-xs w-[145px] bg-background">
                <SelectValue placeholder="All Purchases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Purchases</SelectItem>
                <SelectItem value="verified" className="text-xs">Verified Buyer Only</SelectItem>
                <SelectItem value="unverified" className="text-xs">Unverified / Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Secondary Filter Chips Row */}
        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-muted-foreground font-medium flex items-center gap-1 mr-1 shrink-0">
              <Filter className="h-3.5 w-3.5" /> Status:
            </span>
            <FilterChip
              active={statusFilter === "all"}
              onClick={() => { setStatusFilter("all"); setPage(1); }}
            >
              All ({summary?.total_reviews ?? total})
            </FilterChip>
            <FilterChip
              active={statusFilter === "visible"}
              onClick={() => { setStatusFilter("visible"); setPage(1); }}
            >
              Published ({summary?.visible_reviews ?? 0})
            </FilterChip>
            <FilterChip
              active={statusFilter === "hidden"}
              onClick={() => { setStatusFilter("hidden"); setPage(1); }}
            >
              Hidden ({summary?.hidden_reviews ?? 0})
            </FilterChip>
            <FilterChip
              active={statusFilter === "removed"}
              onClick={() => { setStatusFilter("removed"); setPage(1); }}
            >
              Removed ({summary?.removed_reviews ?? 0})
            </FilterChip>
            <FilterChip
              active={statusFilter === "flagged"}
              onClick={() => { setStatusFilter("flagged"); setPage(1); }}
              variant="alert"
            >
              Flagged Profanity ({summary?.flagged_profanity ?? 0})
            </FilterChip>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                onClick={clearFilters}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
            <span className="text-muted-foreground font-medium">
              Showing {filteredReviews.length} of {total} reviews
            </span>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <TableSkeleton />
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          icon={<MessageSquare className="h-10 w-10" />}
          noun="reviews"
        />
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow className="h-10 bg-muted/40 border-b">
                <TableHead className="h-10 w-64">
                  <SortButton
                    field="customer_name"
                    label="Customer & Verified"
                    active={sortField === "customer_name"}
                    order={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="h-10 w-60">
                  <SortButton
                    field="product_name"
                    label="Product & Vendor"
                    active={sortField === "product_name"}
                    order={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="h-10 w-28 text-center">
                  <SortButton
                    field="rating"
                    label="Rating"
                    active={sortField === "rating"}
                    order={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="h-10">Review Comment</TableHead>
                <TableHead className="h-10 text-center w-28">Status</TableHead>
                <TableHead className="h-10 text-right w-36 pr-3">Quick Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {filteredReviews.map((review) => {
                const customerInitials = (review.customer_name || review.customer_email || "C")
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <TableRow
                    key={review.id}
                    className={`min-h-[64px] hover:bg-muted/40 transition-colors group ${
                      review.moderation_status === "hidden"
                        ? "opacity-75 bg-amber-500/5"
                        : review.moderation_status === "removed"
                        ? "opacity-60 bg-destructive/5"
                        : review.contains_profanity
                        ? "bg-rose-500/5"
                        : ""
                    }`}
                  >
                    {/* Customer Info (Top: Name + Verified badge, Bottom: Email) */}
                    <TableCell className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar / Initials */}
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border">
                          {customerInitials}
                        </div>

                        {/* Customer details */}
                        <div className="flex flex-col justify-center min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-foreground truncate max-w-[140px]">
                              {review.customer_name || "Verified Customer"}
                            </span>
                            {review.is_verified_purchase && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-4 px-1 bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                title="Verified Purchase"
                              >
                                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground truncate mt-0.5 opacity-80">
                            {review.customer_email || "customer@mymeddevices.com"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Product & Vendor (Top: Product name, Bottom: Vendor name) */}
                    <TableCell className="py-2.5 px-4">
                      <div className="flex flex-col justify-center min-w-0">
                        <Link
                          href={`/dashboard/catalog/products?search=${encodeURIComponent(
                            review.product_name || ""
                          )}`}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                          title={review.product_name || "Product"}
                        >
                          {review.product_name || "Medical Device"}
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 opacity-80">
                          <Store className="h-3 w-3" />
                          <span className="truncate">{review.vendor_name || "Direct Marketplace"}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Star Rating */}
                    <TableCell className="py-2.5 px-4 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <= review.rating
                                  ? "fill-amber-400 text-amber-500"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                          {review.rating}.0 / 5
                        </span>
                      </div>
                    </TableCell>

                    {/* Review Snippet & Flagged Badges */}
                    <TableCell className="py-2.5 px-4 max-w-xs md:max-w-md">
                      <div className="space-y-1">
                        <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                          "{review.comment}"
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{new Date(review.created_at).toLocaleDateString()}</span>
                          {review.contains_profanity && (
                            <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                              <ShieldAlert className="h-2.5 w-2.5 mr-0.5" />
                              Profanity Detected
                            </Badge>
                          )}
                          {review.moderation_reason && (
                            <span className="text-amber-600 font-medium truncate max-w-[150px]">
                              Note: {review.moderation_reason}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Moderation Status Badge */}
                    <TableCell className="py-2.5 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        {review.moderation_status === "visible" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-200 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Live
                          </Badge>
                        ) : review.moderation_status === "hidden" ? (
                          <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 border-amber-200 text-xs font-medium">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hidden
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs font-medium">
                            <XCircle className="h-3 w-3 mr-1" />
                            Removed
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Direct Visible Quick Action Icons */}
                    <TableCell className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Inspect & Moderate Details Modal */}
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Inspect & Moderate"
                          onClick={() => openInspectionModal(review)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Quick Toggle Live/Hidden */}
                        {review.moderation_status === "visible" ? (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                            title="Hide Review"
                            onClick={() => handleModerate(review.id, "hidden")}
                            disabled={isUpdatingStatus}
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            title="Approve / Publish Live"
                            onClick={() => handleModerate(review.id, "visible")}
                            disabled={isUpdatingStatus}
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Permanent Delete */}
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete Review"
                          onClick={() => promptDeleteReview(review)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/20 text-xs">
              <span className="text-muted-foreground tabular-nums">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, total)} of {total} reviews
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8"
                >
                  Previous
                </Button>
                <span className="text-muted-foreground tabular-nums">
                  Page {page} of {Math.ceil(total / pageSize)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= Math.ceil(total / pageSize)}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Inspection & Moderation Centered Modal Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden flex flex-col max-h-[85vh] shadow-xl">
          {selectedReview && (
            <div className="flex flex-col h-full max-h-[85vh]">
              {/* Header */}
              <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                        Review Moderation
                        {selectedReview.contains_profanity && (
                          <Badge variant="destructive" className="text-[10px]">
                            Profanity Flagged
                          </Badge>
                        )}
                      </DialogTitle>
                      <DialogDescription className="text-xs mt-0.5 text-muted-foreground">
                        Review ID: <span className="font-mono">{selectedReview.id}</span>
                      </DialogDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= selectedReview.rating
                            ? "fill-amber-400 text-amber-500"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </DialogHeader>

              {/* Scrollable Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Product & Customer Context Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Customer Card */}
                  <div className="p-3.5 bg-muted/25 rounded-xl border space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                      <User className="h-3 w-3" /> Customer
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedReview.customer_name || "Verified Customer"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedReview.customer_email || "N/A"}
                    </p>
                    <div className="pt-1">
                      {selectedReview.is_verified_purchase ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-200 text-[10px]">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                          Verified Purchase
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Unverified / Direct
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Product Card */}
                  <div className="p-3.5 bg-muted/25 rounded-xl border space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                      <Package className="h-3 w-3" /> Medical Device
                    </span>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {selectedReview.product_name || "Product Item"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      {selectedReview.vendor_name || "Marketplace Vendor"}
                    </p>
                    <div className="pt-1">
                      <span className="text-[11px] text-muted-foreground">
                        Submitted: {new Date(selectedReview.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Text Body */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Full Customer Review
                  </Label>
                  <div className="p-4 rounded-xl border bg-card text-foreground text-sm leading-relaxed whitespace-pre-wrap shadow-2xs font-normal">
                    "{selectedReview.comment}"
                  </div>
                </div>

                {/* Profanity Warning Alert */}
                {selectedReview.contains_profanity && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-200 dark:border-rose-900 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400">
                      <AlertTriangle className="h-4 w-4" />
                      Automated Profanity & Safety Violation Detected
                    </div>
                    <p className="text-muted-foreground">
                      This review was flagged by the automated filter. Please verify content suitability for healthcare professionals before publishing.
                    </p>
                    {selectedReview.flagged_words && selectedReview.flagged_words.length > 0 && (
                      <div className="pt-1 flex items-center gap-1 flex-wrap">
                        <span className="text-rose-600 font-medium">Flagged terms:</span>
                        {selectedReview.flagged_words.map((w, idx) => (
                          <Badge key={idx} variant="destructive" className="text-[10px] h-4">
                            {w}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Moderation Reason / Internal Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="mod-reason" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Moderator Note / Action Reason
                  </Label>
                  <Input
                    id="mod-reason"
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    placeholder="e.g. Inappropriate language removed, Verified clinical trial feedback"
                    className="h-9 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Optional reason recorded for internal compliance audit logs.
                  </p>
                </div>
              </div>

              {/* Generously padded centered footer */}
              <DialogFooter className="p-4 sm:p-5 border-t bg-muted/15 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => promptDeleteReview(selectedReview)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-9 order-last sm:order-first"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete Review
                </Button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {selectedReview.moderation_status !== "hidden" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleModerate(selectedReview.id, "hidden", moderationReason)}
                      disabled={isUpdatingStatus}
                      className="text-xs h-9 text-amber-600 hover:text-amber-700"
                    >
                      <EyeOff className="h-3.5 w-3.5 mr-1" />
                      Hide Review
                    </Button>
                  )}

                  {selectedReview.moderation_status !== "removed" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleModerate(selectedReview.id, "removed", moderationReason)}
                      disabled={isUpdatingStatus}
                      className="text-xs h-9 text-destructive hover:text-destructive"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Mark Removed
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={() => handleModerate(selectedReview.id, "visible", moderationReason)}
                    disabled={isUpdatingStatus}
                    className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    Approve & Publish Live
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Modal */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[440px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <AlertDialogTitle className="text-base font-bold text-foreground">
                  Permanently Delete Review?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                  This action cannot be undone. The rating and feedback will be permanently removed from marketplace calculations.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          {reviewToDelete && (
            <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1.5 my-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">
                  {reviewToDelete.customer_name || "Customer"}
                </span>
                <span className="text-amber-500 font-bold">
                  ★ {reviewToDelete.rating}.0 / 5
                </span>
              </div>
              <p className="text-muted-foreground italic line-clamp-2">
                "{reviewToDelete.comment}"
              </p>
            </div>
          )}

          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel disabled={deleting} className="h-9 text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="h-9 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Confirm Permanent Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

// Subcomponents

function StatCard({
  label,
  value,
  subtext,
  icon,
  highlight,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  highlight?: "active" | "warning";
}) {
  return (
    <div
      className={`p-4 rounded-xl border bg-card shadow-2xs transition-all ${
        highlight === "active"
          ? "border-emerald-500/20 bg-emerald-500/5"
          : highlight === "warning"
          ? "border-amber-500/30 bg-amber-500/5"
          : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="p-1.5 rounded-lg bg-background border">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
        {value}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">{subtext}</p>
    </div>
  );
}

function FilterChip({
  children,
  active,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  variant?: "alert";
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
        active
          ? variant === "alert"
            ? "bg-rose-500 text-white shadow-2xs"
            : "bg-primary text-primary-foreground shadow-2xs"
          : variant === "alert"
          ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {children}
    </button>
  );
}

function SortButton({
  field,
  label,
  active,
  order,
  onSort,
}: {
  field: SortField;
  label: string;
  active: boolean;
  order: SortOrder;
  onSort: (field: SortField) => void;
}) {
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 font-semibold text-xs text-muted-foreground hover:text-foreground transition-colors group"
    >
      <span>{label}</span>
      <span className={`text-[10px] ${active ? "text-primary" : "text-muted-foreground/40"}`}>
        {active ? (order === "asc" ? "▲" : "▼") : "▲"}
      </span>
    </button>
  );
}

function TableSkeleton() {
  return (
    <div className="border rounded-xl bg-card p-6 space-y-4 shadow-2xs">
      <div className="h-8 bg-muted animate-pulse rounded-lg w-1/3" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-muted/60 animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClearFilters,
  icon,
  noun,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  icon: React.ReactNode;
  noun: string;
}) {
  return (
    <div className="border border-dashed rounded-xl p-12 text-center bg-card shadow-2xs flex flex-col items-center justify-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground">No {noun} found</h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1">
        {hasFilters
          ? "Try adjusting or clearing your filters to see more results."
          : `No customer ${noun} have been submitted across the platform yet.`}
      </p>
      {hasFilters && (
        <Button
          size="sm"
          variant="outline"
          onClick={onClearFilters}
          className="mt-4 text-xs h-8"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Reset all filters
        </Button>
      )}
    </div>
  );
}
