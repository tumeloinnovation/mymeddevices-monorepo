"use client";

import { useState } from "react";
import {
  Percent,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Tag,
  Gift,
  CheckCircle2,
  Package,
  BadgePercent,
  Layers,
  Sparkles,
  Trash2,
  Edit,
  Power,
  PowerOff,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ProductPromotion {
  id: string;
  name: string;
  badge_label: string;
  promo_type: "percentage" | "fixed_discount" | "bogo" | "clearance";
  discount_value: string;
  target_category: string;
  items_count: number;
  orders_applied: number;
  is_active: boolean;
  valid_until: string;
}

const INITIAL_PROMOTIONS: ProductPromotion[] = [
  {
    id: "promo-1",
    name: "KMPDB Hospital Diagnostic Tools Special",
    badge_label: "HOT DEAL",
    promo_type: "percentage",
    discount_value: "15% OFF",
    target_category: "Diagnostic Equipment",
    items_count: 42,
    orders_applied: 318,
    is_active: true,
    valid_until: "2026-08-31",
  },
  {
    id: "promo-2",
    name: "Surgical Gloves & PPE Clearance Sale",
    badge_label: "PPB CLEARANCE",
    promo_type: "clearance",
    discount_value: "30% OFF",
    target_category: "Surgical Consumables",
    items_count: 18,
    orders_applied: 640,
    is_active: true,
    valid_until: "2026-08-15",
  },
  {
    id: "promo-3",
    name: "Buy 1 Patient Monitor Get 5 Oximeters Free",
    badge_label: "BUNDLE BONUS",
    promo_type: "bogo",
    discount_value: "Buy 1 Get 5 Free",
    target_category: "ICU & Patient Monitoring",
    items_count: 5,
    orders_applied: 89,
    is_active: true,
    valid_until: "2026-09-01",
  },
  {
    id: "promo-4",
    name: "First Aid & Clinic Starter Discount",
    badge_label: "CLINIC SPECIAL",
    promo_type: "fixed_discount",
    discount_value: "KSh 2,500 OFF",
    target_category: "Emergency & First Aid",
    items_count: 24,
    orders_applied: 154,
    is_active: false,
    valid_until: "2026-07-31",
  },
];

export default function ProductPromotionsPage() {
  const [promotions, setPromotions] = useState<ProductPromotion[]>(INITIAL_PROMOTIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    badge_label: "SPECIAL OFFER",
    promo_type: "percentage",
    discount_value: "10% OFF",
    target_category: "Diagnostic Equipment",
    valid_until: "",
  });

  const filteredPromotions = promotions.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.target_category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || p.promo_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const activeCount = promotions.filter((p) => p.is_active).length;
  const totalApplied = promotions.reduce((sum, p) => sum + p.orders_applied, 0);

  const handleCreatePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Promotion name is required");
      return;
    }

    const newPromo: ProductPromotion = {
      id: `promo-${Date.now()}`,
      name: formData.name,
      badge_label: formData.badge_label.toUpperCase(),
      promo_type: formData.promo_type as any,
      discount_value: formData.discount_value,
      target_category: formData.target_category,
      items_count: 12,
      orders_applied: 0,
      is_active: true,
      valid_until: formData.valid_until || "2026-09-30",
    };

    setPromotions([newPromo, ...promotions]);
    setIsModalOpen(false);
    toast.success("Product promotion rule published!");
    setFormData({
      name: "",
      badge_label: "SPECIAL OFFER",
      promo_type: "percentage",
      discount_value: "10% OFF",
      target_category: "Diagnostic Equipment",
      valid_until: "",
    });
  };

  const handleToggleActive = (id: string) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
    );
    toast.success("Promotion status updated");
  };

  const handleDelete = (id: string) => {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
    toast.success("Promotion rule removed");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Promotions & Badging</h1>
            <p className="text-muted-foreground text-sm">
              Configure product category discounts, promo tags (HOT DEAL, PPB CLEARANCE), and special offer rules.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Add Product Promotion
          </Button>
        </div>

        {/* Overview Header Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Active Promotions</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Live catalog offer rules</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Promotional Orders</CardTitle>
              <BadgePercent className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalApplied.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Orders with promo badges</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Promoted Items</CardTitle>
              <Package className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">89 Items</div>
              <p className="text-xs text-muted-foreground mt-1">Tagged with special badges</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Promo Types</CardTitle>
              <Layers className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">4 Active</div>
              <p className="text-xs text-muted-foreground mt-1">Percentage, Fixed, BOGO, Clearance</p>
            </CardContent>
          </Card>
        </div>

        {/* Table & Filter */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search promotion name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Promo Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Promo Types</SelectItem>
                    <SelectItem value="percentage">Percentage OFF</SelectItem>
                    <SelectItem value="fixed_discount">Fixed Discount</SelectItem>
                    <SelectItem value="bogo">Buy 1 Get 1 / Bonus</SelectItem>
                    <SelectItem value="clearance">Clearance</SelectItem>
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
                    <TableHead>Promotion & Badge</TableHead>
                    <TableHead>Target Category</TableHead>
                    <TableHead>Value / Benefit</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPromotions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No product promotions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPromotions.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {p.name}
                          </div>
                          <Badge className="mt-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold">
                            {p.badge_label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline" className="text-xs font-normal">
                            {p.target_category}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{p.items_count} products tagged</p>
                        </TableCell>
                        <TableCell className="font-bold text-sm text-primary">
                          {p.discount_value}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="font-semibold text-foreground">{p.orders_applied}</span> orders applied
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {p.valid_until}
                        </TableCell>
                        <TableCell>
                          {p.is_active ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleToggleActive(p.id)}>
                                {p.is_active ? (
                                  <>
                                    <PowerOff className="mr-2 h-4 w-4 text-amber-500" /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Power className="mr-2 h-4 w-4 text-emerald-500" /> Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(p.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Promotion
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

      {/* Create Slide-over Sheet */}
      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto p-6">
          <form onSubmit={handleCreatePromotion} className="space-y-6">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-xl">
                <Tag className="h-5 w-5 text-primary" /> Create Product Promotion
              </SheetTitle>
              <SheetDescription>
                Define special badging and discount incentives for specific product categories.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="p_name">Promotion Title *</Label>
                <Input
                  id="p_name"
                  placeholder="e.g. ICU Monitor Clearance Special"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge">Badge Tag Label</Label>
                <Input
                  id="badge"
                  placeholder="e.g. HOT DEAL, PPB CLEARANCE"
                  value={formData.badge_label}
                  onChange={(e) => setFormData({ ...formData, badge_label: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="p_type">Promo Type</Label>
                <Select
                  value={formData.promo_type}
                  onValueChange={(val) => setFormData({ ...formData, promo_type: val })}
                >
                  <SelectTrigger id="p_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Discount</SelectItem>
                    <SelectItem value="fixed_discount">Fixed Amount Off</SelectItem>
                    <SelectItem value="bogo">Buy 1 Get 1 / Bundle</SelectItem>
                    <SelectItem value="clearance">Clearance Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="p_val">Value Description</Label>
                <Input
                  id="p_val"
                  placeholder="e.g. 15% OFF or KSh 5,000 OFF"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="p_cat">Target Category</Label>
                <Select
                  value={formData.target_category}
                  onValueChange={(val) => setFormData({ ...formData, target_category: val })}
                >
                  <SelectTrigger id="p_cat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diagnostic Equipment">Diagnostic Equipment</SelectItem>
                    <SelectItem value="Surgical Consumables">Surgical Consumables</SelectItem>
                    <SelectItem value="ICU & Patient Monitoring">ICU & Patient Monitoring</SelectItem>
                    <SelectItem value="Emergency & First Aid">Emergency & First Aid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid">Valid Until Date</Label>
                <Input
                  id="valid"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <SheetFooter className="flex-row justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground">
                Publish Promotion
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
