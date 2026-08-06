"use client";

import { useState } from "react";
import {
  Clock,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Zap,
  Flame,
  CheckCircle2,
  Calendar,
  Package,
  TrendingUp,
  Percent,
  Play,
  Pause,
  Trash2,
  Edit,
  Eye,
  Sparkles,
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

interface FlashSaleEvent {
  id: string;
  title: string;
  banner_url?: string;
  discount_percentage: number;
  featured_products: string[];
  stock_limit: number;
  units_sold: number;
  revenue_generated_ksh: number;
  status: "active" | "upcoming" | "ended" | "paused";
  start_time: string;
  end_time: string;
}

const INITIAL_FLASH_EVENTS: FlashSaleEvent[] = [
  {
    id: "fs-1",
    title: "Mid-Month Diagnostic Equipment Flash Sale",
    discount_percentage: 25,
    featured_products: ["Mindray Patient Monitor ePM 10", "Contec 12-Lead ECG Machine", "Digital Stethoscope Pro"],
    stock_limit: 100,
    units_sold: 84,
    revenue_generated_ksh: 4200000,
    status: "active",
    start_time: "2026-08-05 00:00 AM",
    end_time: "2026-08-07 11:59 PM",
  },
  {
    id: "fs-2",
    title: "PPB Clearance: Sterilization & Autoclaves 30% OFF",
    discount_percentage: 30,
    featured_products: ["Tabletop Steam Autoclave 24L", "UV Sterilization Cabinet"],
    stock_limit: 50,
    units_sold: 50,
    revenue_generated_ksh: 2850000,
    status: "ended",
    start_time: "2026-07-28 00:00 AM",
    end_time: "2026-07-30 11:59 PM",
  },
  {
    id: "fs-3",
    title: "Weekend ICU & Oxygen Concentrator Mega Drop",
    discount_percentage: 20,
    featured_products: ["10L Dual-Flow Oxygen Concentrator", "Portable Pulse Oximeter Bulk Box"],
    stock_limit: 150,
    units_sold: 0,
    revenue_generated_ksh: 0,
    status: "upcoming",
    start_time: "2026-08-12 00:00 AM",
    end_time: "2026-08-14 11:59 PM",
  },
];

export default function FlashSalesPage() {
  const [events, setEvents] = useState<FlashSaleEvent[]>(INITIAL_FLASH_EVENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    discount_percentage: "20",
    stock_limit: "50",
    start_time: new Date().toISOString().split('T')[0],
    end_time: "",
  });

  const filteredEvents = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = events.filter((e) => e.status === "active").length;
  const totalRevenue = events.reduce((sum, e) => sum + e.revenue_generated_ksh, 0);
  const totalUnitsSold = events.reduce((sum, e) => sum + e.units_sold, 0);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Event title is required");
      return;
    }

    const newEvent: FlashSaleEvent = {
      id: `fs-${Date.now()}`,
      title: formData.title,
      discount_percentage: parseFloat(formData.discount_percentage) || 20,
      featured_products: ["Featured Diagnostic Product", "Medical Consumable Pack"],
      stock_limit: parseInt(formData.stock_limit) || 50,
      units_sold: 0,
      revenue_generated_ksh: 0,
      status: "active",
      start_time: formData.start_time,
      end_time: formData.end_time || "2026-08-30",
    };

    setEvents([newEvent, ...events]);
    setIsModalOpen(false);
    toast.success("Flash Sale event launched!");
    setFormData({
      title: "",
      discount_percentage: "20",
      stock_limit: "50",
      start_time: new Date().toISOString().split('T')[0],
      end_time: "",
    });
  };

  const handleToggleStatus = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: e.status === "active" ? "paused" : "active" }
          : e
      )
    );
    toast.success("Flash sale status updated!");
  };

  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success("Flash sale event removed");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Flash Sales & Countdown Events</h1>
            <p className="text-muted-foreground text-sm">
              Create high-urgency promotional deals with stock caps and timed countdown clocks.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Create Flash Sale Event
          </Button>
        </div>

        {/* Analytics Header Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Active Flash Deals</CardTitle>
              <Flame className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">{activeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Live countdown on storefront</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Flash Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">KSh {totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Generated from limited-time sales</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Items Sold</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalUnitsSold.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Claimed promotional units</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Avg Discount Rate</CardTitle>
              <Percent className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">25% OFF</div>
              <p className="text-xs text-muted-foreground mt-1">Buyer savings incentive</p>
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
                  placeholder="Search flash event title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
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
                    <TableHead>Event Title & Products</TableHead>
                    <TableHead>Discount %</TableHead>
                    <TableHead>Stock Cap & Claims</TableHead>
                    <TableHead>Revenue Generated</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No flash sale events found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvents.map((evt) => (
                      <TableRow key={evt.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                            {evt.title}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {evt.featured_products.map((prod, idx) => (
                              <Badge key={idx} variant="outline" className="text-[10px]">
                                {prod}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-rose-600 text-sm">
                          {evt.discount_percentage}% OFF
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="font-semibold">{evt.units_sold}</span> / {evt.stock_limit} units
                          <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-rose-500 h-full"
                              style={{ width: `${Math.min(100, (evt.units_sold / evt.stock_limit) * 100)}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold">
                          KSh {evt.revenue_generated_ksh.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div>Starts: {evt.start_time}</div>
                          <div>Ends: {evt.end_time}</div>
                        </TableCell>
                        <TableCell>
                          {evt.status === "active" && (
                            <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20 animate-pulse">
                              🔥 LIVE
                            </Badge>
                          )}
                          {evt.status === "upcoming" && (
                            <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20">
                              Upcoming
                            </Badge>
                          )}
                          {evt.status === "ended" && (
                            <Badge variant="secondary" className="text-muted-foreground">
                              Ended
                            </Badge>
                          )}
                          {evt.status === "paused" && (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20">
                              Paused
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
                              {evt.status === "active" ? (
                                <DropdownMenuItem onClick={() => handleToggleStatus(evt.id)}>
                                  <Pause className="mr-2 h-4 w-4 text-amber-500" /> Pause Event
                                </DropdownMenuItem>
                              ) : evt.status === "paused" ? (
                                <DropdownMenuItem onClick={() => handleToggleStatus(evt.id)}>
                                  <Play className="mr-2 h-4 w-4 text-emerald-500" /> Resume Event
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(evt.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Event
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

      {/* Launch Flash Sale Slide-over Sheet */}
      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto p-6">
          <form onSubmit={handleCreateEvent} className="space-y-6">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-xl">
                <Flame className="h-5 w-5 text-rose-500" /> Launch Flash Sale Event
              </SheetTitle>
              <SheetDescription>
                Configure a timed promotional sale with special discounted medical inventory.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. 24-Hour Ultrasound & Diagnostic Flash Sale"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Cap</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock_limit}
                    onChange={(e) => setFormData({ ...formData, stock_limit: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start">Start Date</Label>
                <Input
                  id="start"
                  type="date"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End Date</Label>
                <Input
                  id="end"
                  type="date"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <SheetFooter className="flex-row justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-rose-600 text-white hover:bg-rose-700">
                Launch Flash Sale
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
