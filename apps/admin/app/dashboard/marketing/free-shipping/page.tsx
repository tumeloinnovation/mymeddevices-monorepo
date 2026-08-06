"use client";

import { useState } from "react";
import {
  Truck,
  Plus,
  Search,
  Filter,
  MoreVertical,
  MapPin,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Gift,
  MapIcon,
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

interface FreeShippingRule {
  id: string;
  title: string;
  min_basket_ksh: number;
  eligible_zone: string;
  applicable_category: string;
  orders_waived_count: number;
  total_subsidy_ksh: number;
  is_active: boolean;
  valid_until: string;
}

const INITIAL_SHIPPING_RULES: FreeShippingRule[] = [
  {
    id: "fs-rule-1",
    title: "Free Nairobi Metropolitan Express Delivery over KSh 50,000",
    min_basket_ksh: 50000,
    eligible_zone: "Nairobi Metropolitan (Nairobi, Kiambu, Machakos, Kajiado)",
    applicable_category: "All Catalog Products",
    orders_waived_count: 412,
    total_subsidy_ksh: 824000,
    is_active: true,
    valid_until: "2026-12-31",
  },
  {
    id: "fs-rule-2",
    title: "Free Nationwide Dispatch on ICU & Heavy Equipment",
    min_basket_ksh: 200000,
    eligible_zone: "All 47 Kenya Counties",
    applicable_category: "ICU & Patient Monitoring",
    orders_waived_count: 85,
    total_subsidy_ksh: 680000,
    is_active: true,
    valid_until: "2026-10-31",
  },
  {
    id: "fs-rule-3",
    title: "First Order Free Shipping for New Verified Clinics",
    min_basket_ksh: 25000,
    eligible_zone: "All 47 Kenya Counties",
    applicable_category: "All Catalog Products",
    orders_waived_count: 198,
    total_subsidy_ksh: 297000,
    is_active: true,
    valid_until: "2026-09-30",
  },
  {
    id: "fs-rule-4",
    title: "Mombasa & Coast Region Special Free Shipping",
    min_basket_ksh: 100000,
    eligible_zone: "Coast Region (Mombasa, Kilifi, Kwale, Lamu)",
    applicable_category: "Diagnostic Equipment",
    orders_waived_count: 62,
    total_subsidy_ksh: 186000,
    is_active: false,
    valid_until: "2026-07-31",
  },
];

export default function FreeShippingPage() {
  const [rules, setRules] = useState<FreeShippingRule[]>(INITIAL_SHIPPING_RULES);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    min_basket_ksh: "50000",
    eligible_zone: "Nairobi Metropolitan (Nairobi, Kiambu, Machakos, Kajiado)",
    applicable_category: "All Catalog Products",
    valid_until: "",
  });

  const filteredRules = rules.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.eligible_zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = rules.filter((r) => r.is_active).length;
  const totalWaivedOrders = rules.reduce((sum, r) => sum + r.orders_waived_count, 0);
  const totalSubsidyKsh = rules.reduce((sum, r) => sum + r.total_subsidy_ksh, 0);

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Campaign title is required");
      return;
    }

    const newRule: FreeShippingRule = {
      id: `fs-rule-${Date.now()}`,
      title: formData.title,
      min_basket_ksh: parseFloat(formData.min_basket_ksh) || 50000,
      eligible_zone: formData.eligible_zone,
      applicable_category: formData.applicable_category,
      orders_waived_count: 0,
      total_subsidy_ksh: 0,
      is_active: true,
      valid_until: formData.valid_until || "2026-12-31",
    };

    setRules([newRule, ...rules]);
    setIsModalOpen(false);
    toast.success("Free Shipping campaign rule created!");
    setFormData({
      title: "",
      min_basket_ksh: "50000",
      eligible_zone: "Nairobi Metropolitan (Nairobi, Kiambu, Machakos, Kajiado)",
      applicable_category: "All Catalog Products",
      valid_until: "",
    });
  };

  const handleToggleActive = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r))
    );
    toast.success("Free shipping rule status updated");
  };

  const handleDelete = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast.success("Free shipping rule deleted");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Free Shipping Rules & Incentives</h1>
            <p className="text-muted-foreground text-sm">
              Configure minimum order value thresholds and regional free delivery promotions across Kenya.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Add Free Shipping Rule
          </Button>
        </div>

        {/* Analytics Header Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Active Shipping Rules</CardTitle>
              <Truck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Active delivery campaigns</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Free Deliveries Granted</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalWaivedOrders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Orders with 0 KSh delivery fee</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Delivery Subsidy</CardTitle>
              <DollarSign className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">KSh {totalSubsidyKsh.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Absorbed shipping costs</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Avg Threshold</CardTitle>
              <Gift className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">KSh 75,000</div>
              <p className="text-xs text-muted-foreground mt-1">Min basket spend requirement</p>
            </CardContent>
          </Card>
        </div>

        {/* Table & Search */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shipping rule or county zone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name & Category</TableHead>
                    <TableHead>Min Basket Spend</TableHead>
                    <TableHead>Eligible Geographic Zone</TableHead>
                    <TableHead>Impact & Subsidy</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No free shipping rules found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRules.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <Truck className="h-4 w-4 text-emerald-600" />
                            {r.title}
                          </div>
                          <Badge variant="outline" className="text-[10px] mt-1 font-normal">
                            {r.applicable_category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-sm text-foreground">
                          KSh {r.min_basket_ksh.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span>{r.eligible_zone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-semibold text-foreground">{r.orders_waived_count} orders</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            KSh {r.total_subsidy_ksh.toLocaleString()} cost
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {r.valid_until}
                        </TableCell>
                        <TableCell>
                          {r.is_active ? (
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
                              <DropdownMenuItem onClick={() => handleToggleActive(r.id)}>
                                {r.is_active ? (
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
                                onClick={() => handleDelete(r.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Rule
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
          <form onSubmit={handleCreateRule} className="space-y-6">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-xl">
                <Truck className="h-5 w-5 text-emerald-600" /> Create Free Shipping Rule
              </SheetTitle>
              <SheetDescription>
                Set minimum basket threshold and regional shipping waiver conditions.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="r_title">Campaign Title *</Label>
                <Input
                  id="r_title"
                  placeholder="e.g. Free Nairobi Express Shipping over KSh 30,000"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_spend">Min Basket Value (KSh)</Label>
                <Input
                  id="min_spend"
                  type="number"
                  value={formData.min_basket_ksh}
                  onChange={(e) => setFormData({ ...formData, min_basket_ksh: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Eligible Category</Label>
                <Select
                  value={formData.applicable_category}
                  onValueChange={(val) => setFormData({ ...formData, applicable_category: val })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Catalog Products">All Catalog Products</SelectItem>
                    <SelectItem value="ICU & Patient Monitoring">ICU & Patient Monitoring</SelectItem>
                    <SelectItem value="Diagnostic Equipment">Diagnostic Equipment</SelectItem>
                    <SelectItem value="Surgical Consumables">Surgical Consumables</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone">Eligible Geographic Zone</Label>
                <Select
                  value={formData.eligible_zone}
                  onValueChange={(val) => setFormData({ ...formData, eligible_zone: val })}
                >
                  <SelectTrigger id="zone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nairobi Metropolitan (Nairobi, Kiambu, Machakos, Kajiado)">
                      Nairobi Metropolitan
                    </SelectItem>
                    <SelectItem value="All 47 Kenya Counties">All 47 Kenya Counties</SelectItem>
                    <SelectItem value="Coast Region (Mombasa, Kilifi, Kwale, Lamu)">Coast Region</SelectItem>
                    <SelectItem value="Rift Valley & Western Region">Rift Valley & Western</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="until">Valid Until Date</Label>
                <Input
                  id="until"
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
              <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">
                Publish Free Shipping Rule
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
