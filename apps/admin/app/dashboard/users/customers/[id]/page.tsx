"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Clock,
  Ban,
  CheckCircle2,
  Package,
  Award,
  Shield,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  FileText,
  User,
  ArrowUpRight,
  Settings,
  ShieldAlert,
  Bell,
  Activity,
  Globe,
  MoreHorizontal,
  Send,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  Search,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ShoppingBag,
  Heart,
  Star,
  MessageSquare,
  Sparkles,
  Store
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { usersService, shoppingService, type CustomerDetail } from "@mymeddevices/shared-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [customerData, ordersData] = await Promise.all([
          usersService.getCustomer(id),
          shoppingService.adminListOrders({ user_id: id })
        ]);
        setCustomer(customerData);
        
        // Support both array response and wrapped response
        const ordersList = Array.isArray(ordersData)
          ? ordersData
          : (ordersData as any)?.orders || [];
        setOrders(ordersList);
      } catch (error) {
        console.error("Failed to load customer details", error);
        toast.error("Failed to load customer details");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleStatusChange = async (action: "activate" | "deactivate" | "suspend") => {
    setActionLoading(true);
    try {
      const response = await usersService.updateCustomerStatus(id, action);
      toast.success(response.message || `Customer status updated successfully`);
      
      // Reload customer details
      const customerData = await usersService.getCustomer(id);
      setCustomer(customerData);
    } catch (error: any) {
      console.error(`Failed to ${action} customer`, error);
      toast.error(error.message || `Failed to update customer status`);
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString?: string, formatTime = false) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (formatTime) {
      return d.toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    }
    return d.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getOrderStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "paid":
      case "completed":
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Paid
          </span>
        );
      case "canceled":
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span> Canceled
          </span>
        );
      case "shipped":
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> {status}
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[500px] gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading customer profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-muted-foreground flex flex-col items-center justify-center gap-4">
          <XCircle className="size-16 text-destructive/80" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Customer Not Found</h2>
            <p className="text-sm text-muted-foreground mt-1">The customer profile you are looking for does not exist or has been deleted.</p>
          </div>
          <Button variant="outline" className="mt-2" asChild>
            <Link href="/dashboard/users/customers">Back to Customers</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isActive = customer.status === "active";

  // Calculate Metrics
  const totalOrdersCount = orders.length;
  const totalSpend = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const avgOrderValue = totalOrdersCount > 0 ? totalSpend / totalOrdersCount : 0;
  const lastOrderDate = orders.length > 0 && orders[0]?.created_at 
    ? formatDate(orders[0].created_at) 
    : "—";

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = (o.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.items || []).some((item: any) => (item.product_name || "").toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || (o.status || "").toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
        
        {/* Header Bar matching Reference UI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 shadow-sm shrink-0">
              <Link href="/dashboard/users/customers">
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Link>
            </Button>
            
            <Avatar className="h-14 w-14 border border-slate-200 shadow-sm shrink-0">
              <AvatarImage src={(customer as any).avatar_url || ""} />
              <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold text-lg">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{customer.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
                  {isActive ? "Active" : "Suspended"}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-medium text-slate-500">
                  Customer ID <span className="font-mono text-slate-700 font-semibold">#{customer.id.slice(-6)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-slate-200 text-slate-600">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isActive ? (
                  <DropdownMenuItem onClick={() => handleStatusChange("suspend")} className="text-rose-600">
                    <Ban className="mr-2 h-4 w-4" /> Suspend Customer
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleStatusChange("activate")} className="text-emerald-600">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Activate Customer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button className="gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm text-xs font-medium h-9 px-4">
              <Send className="h-3.5 w-3.5" />
              Send Message
            </Button>

            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-white">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-900 rounded">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-900 rounded">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 2-Column Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Left Column (70% width) */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Metrics Header Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div>
                <p className="text-xs font-medium text-slate-400">No. of Order</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalOrdersCount}</p>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <p className="text-xs font-medium text-slate-400">Total Spend</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-1">
                  {formatCurrency(totalSpend)}
                  <ArrowUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                </p>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <p className="text-xs font-medium text-slate-400">Avg. Order Value</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-1">
                  {formatCurrency(avgOrderValue)}
                  <ArrowDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                </p>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <p className="text-xs font-medium text-slate-400">Last Order</p>
                <p className="text-base font-semibold text-slate-800 mt-2">{lastOrderDate}</p>
              </div>
            </div>

            {/* Main Tabs Container */}
            <Tabs defaultValue="purchase" className="w-full">
              <TabsList className="w-full justify-start border-b border-slate-200 rounded-none bg-transparent h-auto p-0 gap-6 overflow-x-auto no-scrollbar">
                <TabsTrigger 
                  value="purchase" 
                  className="rounded-none border-b-2 border-transparent data-active:border-slate-900 data-active:text-slate-900 text-slate-500 font-semibold text-xs py-3 px-1 shadow-none transition-all"
                >
                  Purchase History
                </TabsTrigger>
                <TabsTrigger 
                  value="wishlist" 
                  className="rounded-none border-b-2 border-transparent data-active:border-slate-900 data-active:text-slate-900 text-slate-500 font-semibold text-xs py-3 px-1 shadow-none transition-all"
                >
                  Wishlist
                </TabsTrigger>
                <TabsTrigger 
                  value="review" 
                  className="rounded-none border-b-2 border-transparent data-active:border-slate-900 data-active:text-slate-900 text-slate-500 font-semibold text-xs py-3 px-1 shadow-none transition-all"
                >
                  Review
                </TabsTrigger>
                <TabsTrigger 
                  value="loyalty" 
                  className="rounded-none border-b-2 border-transparent data-active:border-slate-900 data-active:text-slate-900 text-slate-500 font-semibold text-xs py-3 px-1 shadow-none transition-all"
                >
                  Loyalty Program
                </TabsTrigger>
                <TabsTrigger 
                  value="tickets" 
                  className="rounded-none border-b-2 border-transparent data-active:border-slate-900 data-active:text-slate-900 text-slate-500 font-semibold text-xs py-3 px-1 shadow-none transition-all"
                >
                  Support ticket
                </TabsTrigger>
                <TabsTrigger 
                  value="insight" 
                  className="rounded-none border-b-2 border-transparent data-active:border-slate-900 data-active:text-slate-900 text-slate-500 font-semibold text-xs py-3 px-1 shadow-none transition-all"
                >
                  Insight
                </TabsTrigger>
                <TabsTrigger 
                  value="activity" 
                  className="rounded-none border-b-2 border-transparent data-active:border-slate-900 data-active:text-slate-900 text-slate-500 font-semibold text-xs py-3 px-1 shadow-none transition-all"
                >
                  Activity
                </TabsTrigger>
              </TabsList>

              {/* Purchase History Tab Content */}
              <TabsContent value="purchase" className="mt-5 space-y-4">
                
                {/* Search & Filter Toolbar */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input 
                      placeholder="Search orders or items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white font-medium text-slate-700 outline-none"
                  >
                    <option value="all">Status: All</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Canceled</option>
                  </select>
                </div>

                {/* Orders Table */}
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-14 flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="h-10 w-10 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-800">No matching orders found</p>
                      <p className="text-xs text-slate-400">Try adjusting your filter parameters or search query.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-semibold text-slate-500 py-3">Item List</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 py-3">Order Date</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 py-3">Status</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 py-3 text-right">Total Amount</TableHead>
                          <TableHead className="w-10 py-3"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => {
                          const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                          const itemName = firstItem?.product_name || `Order #${order.id.slice(-6)}`;
                          const extraCount = order.items && order.items.length > 1 ? order.items.length - 1 : 0;
                          
                          return (
                            <TableRow key={order.id} className="hover:bg-slate-50/50 border-b border-slate-100 text-xs">
                              <TableCell className="py-3 font-medium text-slate-900">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0 overflow-hidden">
                                    {firstItem?.image_url ? (
                                      <img src={firstItem.image_url} alt={itemName} className="h-full w-full object-cover" />
                                    ) : (
                                      <Package className="h-4 w-4 text-slate-400" />
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="truncate font-semibold text-slate-800 max-w-[200px] sm:max-w-[280px]">
                                      {itemName}
                                    </span>
                                    {extraCount > 0 && (
                                      <span className="text-[10px] text-slate-400">+{extraCount} more items</span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-3 text-slate-500 font-medium">
                                {formatDate(order.created_at)}
                              </TableCell>
                              <TableCell className="py-3">
                                {getOrderStatusBadge(order.status)}
                              </TableCell>
                              <TableCell className="py-3 font-semibold text-slate-900 text-right">
                                {formatCurrency(order.total_amount || 0)}
                              </TableCell>
                              <TableCell className="py-3 text-right">
                                <Button variant="ghost" size="icon" asChild className="h-7 w-7 text-slate-400 hover:text-slate-900 rounded">
                                  <Link href={`/dashboard/orders/${order.id}`}>
                                    <ArrowUpRight className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>

              {/* Wishlist Tab */}
              <TabsContent value="wishlist" className="mt-5">
                <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                  <Heart className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-800 text-sm">Wishlist Items</h3>
                  <p className="text-xs text-slate-400 mt-1">Customer has 3 saved medical items in their wishlist.</p>
                </div>
              </TabsContent>

              {/* Review Tab */}
              <TabsContent value="review" className="mt-5">
                <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                  <Star className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-800 text-sm">Product Reviews</h3>
                  <p className="text-xs text-slate-400 mt-1">No verified customer reviews submitted yet.</p>
                </div>
              </TabsContent>

              {/* Loyalty Tab */}
              <TabsContent value="loyalty" className="mt-5">
                <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Tier Status</span>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-bold uppercase text-[10px]">
                      {customer.loyalty_tier || "Gold Tier"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-500">Available Points</span>
                    <span className="text-2xl font-bold text-slate-900">{customer.loyalty_points ?? 1250} pts</span>
                  </div>
                </div>
              </TabsContent>

              {/* Support Ticket Tab */}
              <TabsContent value="tickets" className="mt-5">
                <div className="p-8 text-center bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                  <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-semibold text-slate-800 text-sm">Support Tickets</h3>
                  <p className="text-xs text-slate-400 mt-1">No active support conversations registered.</p>
                </div>
              </TabsContent>

              {/* Insight Tab Content */}
              <TabsContent value="insight" className="mt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <h4 className="font-bold text-slate-900 text-sm">Purchase Behavior</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      High-frequency procurement customer with average re-order interval of 18 days. Preferred payment channel: M-Pesa STK Push.
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                      <span className="text-slate-400">Predicted Lifetime Value</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(totalSpend * 2.4 || 150000)}</span>
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <h4 className="font-bold text-slate-900 text-sm">Top Device Categories</h4>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700 font-medium">Diagnostic & Monitoring</span>
                        <span className="font-semibold text-slate-900">55%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: "55%" }}></div>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-700 font-medium">Surgical Instruments</span>
                        <span className="font-semibold text-slate-900">30%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: "30%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="mt-5">
                <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-700 font-medium">Logged in via Customer Portal</span>
                    <span className="text-slate-400 ml-auto">{formatDate(customer.last_login, true)}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

          </div>

          {/* Right Sidebar (30% width) matching Reference Layout */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Customer Details Widget */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Customer Details</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Customer Source</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <Store className="h-3.5 w-3.5 text-slate-400" />
                    Online Store
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Last Online</span>
                  <span className="font-medium text-slate-700">
                    {formatDate(customer.last_login || customer.joined_date, true)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address & Map Preview Widget */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Shipping Address</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-700">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Visual Map Mock Card */}
              <div className="relative h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center group">
                <img 
                  src="https://maps.googleapis.com/maps/api/staticmap?center=-1.286389,36.817223&zoom=13&size=400x150&sensor=false"
                  alt="Address Map" 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300" 
                  onError={(e) => {
                    // Fallback map styling if static map is blocked
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md animate-bounce">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-xs">{customer.name}</span>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent((customer as any).address || "Nairobi, Kenya")}`} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-0.5">
                    View on Map
                  </a>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {(customer as any).address || "Upper Hill Medical Centre, Suite 402, Ralph Bunche Rd, Nairobi, Kenya"}
                </p>
              </div>
            </div>

            {/* Contact Information Widget */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Contact Information</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-700">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-2.5">
                <div className="p-2.5 rounded-full border border-sky-200 bg-sky-50/60 text-sky-800 text-xs font-semibold flex items-center justify-between px-4">
                  <span className="truncate">{customer.email}</span>
                  <Mail className="h-3.5 w-3.5 text-sky-500 shrink-0 ml-2" />
                </div>
                <div className="p-2.5 rounded-full border border-sky-200 bg-sky-50/60 text-sky-800 text-xs font-semibold flex items-center justify-between px-4">
                  <span>{customer.phone || "+254 712 345 678"}</span>
                  <Phone className="h-3.5 w-3.5 text-sky-500 shrink-0 ml-2" />
                </div>
              </div>
            </div>

            {/* Audience Group Widget */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Audience Group</h3>
              <Button variant="outline" size="sm" className="w-full h-9 rounded-xl border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Audience
              </Button>
            </div>

            {/* Tags Widget */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Tags</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">VIP Buyer</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Healthcare Clinic</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Repeat Customer</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

