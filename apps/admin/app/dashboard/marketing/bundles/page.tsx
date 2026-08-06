"use client";

import { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Boxes,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Layers,
  Sparkles,
  Trash2,
  Edit,
  Power,
  PowerOff,
  Eye,
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

interface BundleDeal {
  id: string;
  title: string;
  description: string;
  items_included: string[];
  original_price_ksh: number;
  bundle_price_ksh: number;
  stock_packages: number;
  sold_count: number;
  is_active: boolean;
}

const INITIAL_BUNDLES: BundleDeal[] = [
  {
    id: "bundle-1",
    title: "ICU Critical Care Starter Package",
    description: "Complete ICU setup including patient monitor, defibrillator, and dual-flow oxygen concentrator.",
    items_included: [
      "1x Mindray Patient Monitor ePM 10",
      "1x Medtronic Portable Defibrillator",
      "1x 10L Dual-Flow Oxygen Concentrator",
    ],
    original_price_ksh: 480000,
    bundle_price_ksh: 395000,
    stock_packages: 15,
    sold_count: 12,
    is_active: true,
  },
  {
    id: "bundle-2",
    title: "Clinic Diagnostic & Screening Combo",
    description: "All-in-one diagnostic setup for outpatient clinics and health centers.",
    items_included: [
      "1x Contec 12-Lead ECG Machine",
      "2x Digital Blood Pressure Monitors",
      "5x Fingertip Pulse Oximeters",
      "1x Non-Contact Infrared Thermometer",
    ],
    original_price_ksh: 185000,
    bundle_price_ksh: 149000,
    stock_packages: 30,
    sold_count: 24,
    is_active: true,
  },
  {
    id: "bundle-3",
    title: "Surgical Theatre Consumable Box (Bulk 50x)",
    description: "Sterile surgical drapes, gowns, gloves, and scalpels for operating theaters.",
    items_included: [
      "50x Sterile Surgical Gown Sets",
      "10x Boxes Latex Gloves (100s)",
      "5x Disposable Scalpel Boxes",
    ],
    original_price_ksh: 75000,
    bundle_price_ksh: 58000,
    stock_packages: 50,
    sold_count: 45,
    is_active: true,
  },
];

export default function BundleDealsPage() {
  const [bundles, setBundles] = useState<BundleDeal[]>(INITIAL_BUNDLES);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<BundleDeal | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    items_included: "1x Diagnostic Monitor\n2x Oxygen Sensors\n1x Power Adapter",
    original_price_ksh: "150000",
    bundle_price_ksh: "120000",
    stock_packages: "20",
  });

  const filteredBundles = bundles.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = bundles.filter((b) => b.is_active).length;
  const totalRevenue = bundles.reduce((sum, b) => sum + b.sold_count * b.bundle_price_ksh, 0);
  const totalPackagesSold = bundles.reduce((sum, b) => sum + b.sold_count, 0);

  const handleCreateBundle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Bundle title is required");
      return;
    }

    const items = formData.items_included.split("\n").filter((i) => i.trim().length > 0);

    const newBundle: BundleDeal = {
      id: `bundle-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      items_included: items,
      original_price_ksh: parseFloat(formData.original_price_ksh) || 100000,
      bundle_price_ksh: parseFloat(formData.bundle_price_ksh) || 85000,
      stock_packages: parseInt(formData.stock_packages) || 10,
      sold_count: 0,
      is_active: true,
    };

    setBundles([newBundle, ...bundles]);
    setIsModalOpen(false);
    toast.success("Bundle Package Deal created!");
    setFormData({
      title: "",
      description: "",
      items_included: "1x Diagnostic Monitor\n2x Oxygen Sensors\n1x Power Adapter",
      original_price_ksh: "150000",
      bundle_price_ksh: "120000",
      stock_packages: "20",
    });
  };

  const handleToggleActive = (id: string) => {
    setBundles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, is_active: !b.is_active } : b))
    );
    toast.success("Bundle deal status updated");
  };

  const handleDelete = (id: string) => {
    setBundles((prev) => prev.filter((b) => b.id !== id));
    toast.success("Bundle package deal deleted");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bundle Deals & Equipment Packages</h1>
            <p className="text-muted-foreground text-sm">
              Combine complementary medical devices and consumables into discounted package deals for clinics.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Create Bundle Package
          </Button>
        </div>

        {/* Analytics Header Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Active Bundles</CardTitle>
              <Boxes className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Live equipment packages</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Packages Sold</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{totalPackagesSold}</div>
              <p className="text-xs text-muted-foreground mt-1">Clinic bundle orders</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Bundle Sales Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">KSh {totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total revenue generated</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Average Buyer Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">18.5% OFF</div>
              <p className="text-xs text-muted-foreground mt-1">Versus buying items individually</p>
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
                  placeholder="Search bundle packages..."
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
                    <TableHead>Bundle Title & Description</TableHead>
                    <TableHead>Included Items</TableHead>
                    <TableHead>Pricing & Savings</TableHead>
                    <TableHead>Stock & Claims</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBundles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No bundle deals found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBundles.map((b) => {
                      const savingsKsh = b.original_price_ksh - b.bundle_price_ksh;
                      const savingsPct = Math.round((savingsKsh / b.original_price_ksh) * 100);
                      return (
                        <TableRow key={b.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <div className="font-semibold text-foreground">{b.title}</div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{b.description}</p>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {b.items_included.map((item, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px] block font-normal w-fit">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-sm text-foreground">
                              KSh {b.bundle_price_ksh.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground line-through">
                              KSh {b.original_price_ksh.toLocaleString()}
                            </div>
                            <div className="text-[10px] font-bold text-emerald-600">
                              Save KSh {savingsKsh.toLocaleString()} ({savingsPct}%)
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className="font-semibold">{b.sold_count}</span> / {b.stock_packages} sold
                          </TableCell>
                          <TableCell>
                            {b.is_active ? (
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
                                <DropdownMenuItem onClick={() => setSelectedBundle(b)}>
                                  <Eye className="mr-2 h-4 w-4" /> View Package Items
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActive(b.id)}>
                                  {b.is_active ? (
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
                                  onClick={() => handleDelete(b.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete Package
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
          <form onSubmit={handleCreateBundle} className="space-y-6">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-xl">
                <Boxes className="h-5 w-5 text-primary" /> Create Equipment Bundle Package
              </SheetTitle>
              <SheetDescription>
                Group multiple medical items together and set a special discounted bundle price.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="b_title">Bundle Title *</Label>
                <Input
                  id="b_title"
                  placeholder="e.g. Clinic Outpatient Diagnostic Suite"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="b_desc">Package Overview</Label>
                <Textarea
                  id="b_desc"
                  rows={2}
                  placeholder="e.g. Complete outpatient kit designed for small clinics and health centers."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="b_items">Bundled Items List (One per line)</Label>
                <Textarea
                  id="b_items"
                  rows={4}
                  value={formData.items_included}
                  onChange={(e) => setFormData({ ...formData, items_included: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orig_price">Original Total (KSh)</Label>
                <Input
                  id="orig_price"
                  type="number"
                  value={formData.original_price_ksh}
                  onChange={(e) => setFormData({ ...formData, original_price_ksh: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bundle_price">Bundle Price (KSh)</Label>
                <Input
                  id="bundle_price"
                  type="number"
                  value={formData.bundle_price_ksh}
                  onChange={(e) => setFormData({ ...formData, bundle_price_ksh: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_pkgs">Stock Cap</Label>
                <Input
                  id="stock_pkgs"
                  type="number"
                  value={formData.stock_packages}
                  onChange={(e) => setFormData({ ...formData, stock_packages: e.target.value })}
                />
              </div>
            </div>

            <SheetFooter className="flex-row justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground">
                Publish Bundle Package
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Items Preview Slide-over Sheet */}
      {selectedBundle && (
        <Sheet open={!!selectedBundle} onOpenChange={() => setSelectedBundle(null)}>
          <SheetContent side="right" className="sm:max-w-md p-6">
            <SheetHeader>
              <SheetTitle>{selectedBundle.title}</SheetTitle>
              <SheetDescription>{selectedBundle.description}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <Label className="text-xs font-semibold">Included Items Breakdown:</Label>
              <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                {selectedBundle.items_included.map((item, idx) => (
                  <div key={idx} className="text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-xs border-t pt-3">
                <span>Bundle Offer Price:</span>
                <span className="font-bold text-sm text-primary">KSh {selectedBundle.bundle_price_ksh.toLocaleString()}</span>
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setSelectedBundle(null)}>
                Close
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </DashboardLayout>
  );
}
