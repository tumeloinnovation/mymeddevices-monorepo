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
  Eye,
  Activity,
  Globe
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { usersService, shoppingService, type CustomerDetail } from "@mymeddevices/shared-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-KE", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOrderStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "paid":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLoyaltyTierBadge = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "platinum":
        return (
          <Badge className="bg-gradient-to-r from-slate-300 via-indigo-200 to-slate-300 text-slate-800 font-bold border-indigo-300 hover:brightness-105 transition-all">
            <Award className="mr-1 h-3.5 w-3.5 animate-pulse text-indigo-700" /> Platinum
          </Badge>
        );
      case "gold":
        return (
          <Badge className="bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-100 text-amber-800 font-bold border-amber-300 hover:brightness-105 transition-all">
            <Award className="mr-1 h-3.5 w-3.5 text-amber-600" /> Gold
          </Badge>
        );
      case "silver":
        return (
          <Badge className="bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 text-slate-700 font-bold border-slate-300 hover:brightness-105 transition-all">
            <Award className="mr-1 h-3.5 w-3.5 text-slate-500" /> Silver
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gradient-to-r from-orange-100 via-orange-200 to-orange-100 text-orange-800 font-bold border-orange-200 hover:brightness-105 transition-all">
            <Award className="mr-1 h-3.5 w-3.5 text-orange-700" /> Bronze
          </Badge>
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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild className="shrink-0 hover:bg-accent">
              <Link href="/dashboard/users/customers">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{customer.name}</h1>
                <Badge variant={isActive ? "default" : "destructive"} className={isActive ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                  {isActive ? "Active" : "Suspended"}
                </Badge>
                {customer.is_verified ? (
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Unverified
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-1">ID: {customer.id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 px-3 py-1 font-semibold">
              Loyalty Points: {customer.loyalty_points ?? 0} pts
            </Badge>
          </div>
        </div>

        {/* Tab Interface */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-6">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent px-4 py-2 font-semibold shadow-none"
            >
              <User className="h-4 w-4 mr-1.5" /> Overview
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent px-4 py-2 font-semibold shadow-none"
            >
              <Package className="h-4 w-4 mr-1.5" /> Orders ({orders.length})
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent px-4 py-2 font-semibold shadow-none"
            >
              <Settings className="h-4 w-4 mr-1.5" /> Preferences
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent px-4 py-2 font-semibold shadow-none"
            >
              <ShieldAlert className="h-4 w-4 mr-1.5" /> Security & Status
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Profile Card */}
              <Card className="lg:col-span-1 border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center py-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <Avatar className="h-16 w-16 mb-2 border-2 border-white shadow-md">
                      <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                        {getInitials(customer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-foreground">{customer.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{customer.email}</p>
                  </div>

                  <div className="space-y-3 pt-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium text-foreground">{customer.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium text-foreground">{customer.phone || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant="secondary" className="font-mono text-xs uppercase">Customer</Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium text-foreground">{formatDate(customer.joined_date)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Last Login:</span>
                      <span className="font-medium text-foreground">{formatDate(customer.last_login)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loyalty & Purchases Summary */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Loyalty Card */}
                  <Card className="border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full pointer-events-none" />
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" /> Loyalty Club
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tier</span>
                        {getLoyaltyTierBadge(customer.loyalty_tier || "bronze")}
                      </div>
                      <div className="flex justify-between items-baseline pt-1">
                        <span className="text-sm text-muted-foreground">Loyalty Points</span>
                        <span className="text-xl font-bold text-foreground">
                          {customer.loyalty_points ?? 0} <span className="text-xs font-normal text-muted-foreground">pts</span>
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Purchase Card */}
                  <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4 text-emerald-600" /> Purchases
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Orders</span>
                        <span className="font-bold text-foreground text-lg">{orders.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Spent to Date</span>
                        <span className="font-bold text-emerald-700 text-lg">
                          {formatCurrency(orders.reduce((sum, order) => sum + (order.total_amount || 0), 0))}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                </div>

                {/* Admin Notes */}
                <Card className="border-slate-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-600" /> Administrative Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customer.notes ? (
                      <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-lg text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {customer.notes}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-sm">
                        No administrative notes registered for this account.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* ORDERS TAB */}
          <TabsContent value="orders" className="mt-6">
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4 pb-4">
                <div>
                  <CardTitle className="text-base font-semibold">Purchase History</CardTitle>
                  <CardDescription>View, track and check payment statuses of orders</CardDescription>
                </div>
                <div className="flex gap-4 text-sm shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Cumulative Spend</p>
                    <p className="font-bold text-foreground">
                      {formatCurrency(orders.reduce((sum, order) => sum + (order.total_amount || 0), 0))}
                    </p>
                  </div>
                  <div className="text-right border-l pl-4">
                    <p className="text-xs text-muted-foreground">Transaction Count</p>
                    <p className="font-bold text-foreground">{orders.length} orders</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-lg flex flex-col items-center justify-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground/60 animate-pulse" />
                    <h3 className="font-semibold text-slate-800">No Orders Placed</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">This customer hasn't purchased any items on the platform yet.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-100 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="font-semibold">Order ID</TableHead>
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Items Count</TableHead>
                          <TableHead className="font-semibold">Amount Paid</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id} className="hover:bg-slate-50/30 transition-colors">
                            <TableCell className="font-mono text-xs text-foreground">
                              {order.id}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(order.created_at)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {order.items?.length || 0} {order.items?.length === 1 ? "item" : "items"}
                            </TableCell>
                            <TableCell className="font-semibold text-foreground text-sm">
                              {formatCurrency(order.total_amount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${getOrderStatusColor(order.status)}`}>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" asChild className="hover:bg-accent shrink-0">
                                <Link href="/dashboard/shopping/orders" title="View details in transactions">
                                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
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
          </TabsContent>

          {/* PREFERENCES TAB */}
          <TabsContent value="preferences" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Notification preferences */}
              <Card className="md:col-span-2 border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" /> Communication Channels
                  </CardTitle>
                  <CardDescription>Preferred notification methods and marketing subscriptions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Email Notifications</h3>
                    
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <div>
                        <p className="text-sm font-medium text-foreground">Order & Transaction Updates</p>
                        <p className="text-xs text-muted-foreground">Receive invoices, status changes, and shipping updates</p>
                      </div>
                      <Badge variant="outline" className={customer.email_order_updates ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                        {customer.email_order_updates ? "Subscribed" : "Disabled"}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <div>
                        <p className="text-sm font-medium text-foreground">Newsletter Updates</p>
                        <p className="text-xs text-muted-foreground">Receive weekly roundups, product features, and community guides</p>
                      </div>
                      <Badge variant="outline" className={customer.email_newsletter ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                        {customer.email_newsletter ? "Subscribed" : "Disabled"}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <div>
                        <p className="text-sm font-medium text-foreground">Promotions & Campaigns</p>
                        <p className="text-xs text-muted-foreground">Receive discounts, coupon codes, and clearance alerts</p>
                      </div>
                      <Badge variant="outline" className={customer.email_promotions ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                        {customer.email_promotions ? "Subscribed" : "Disabled"}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">Security & Safety Updates</p>
                        <p className="text-xs text-muted-foreground">Receive urgent warnings, password resets, and suspicious action logs</p>
                      </div>
                      <Badge variant="outline" className={customer.email_security ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                        {customer.email_security ? "Subscribed" : "Disabled"}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">SMS Notifications</h3>
                    
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <div>
                        <p className="text-sm font-medium text-foreground">Order Updates</p>
                        <p className="text-xs text-muted-foreground">Fast updates on delivery dispatch or delays via phone</p>
                      </div>
                      <Badge variant="outline" className={customer.sms_order_updates ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                        {customer.sms_order_updates ? "Subscribed" : "Disabled"}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <div>
                        <p className="text-sm font-medium text-foreground">Marketing Alerts</p>
                        <p className="text-xs text-muted-foreground">Receive text alerts about hourly flash sales</p>
                      </div>
                      <Badge variant="outline" className={customer.sms_promotions ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                        {customer.sms_promotions ? "Subscribed" : "Disabled"}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">Security Notifications</p>
                        <p className="text-xs text-muted-foreground">Receive 2FA login verification codes via SMS</p>
                      </div>
                      <Badge variant="outline" className={customer.sms_security ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                        {customer.sms_security ? "Subscribed" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Local preferences */}
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-emerald-600" /> System Preferences
                  </CardTitle>
                  <CardDescription>Localized app preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Language</p>
                    <Badge variant="secondary" className="font-mono text-xs capitalize px-2 py-0.5">
                      {customer.language === "en" ? "English (EN)" : customer.language || "English (EN)"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Timezone</p>
                    <Badge variant="secondary" className="font-mono text-xs uppercase px-2 py-0.5">
                      {customer.timezone === "eat" ? "East Africa Time (EAT)" : customer.timezone || "East Africa Time (EAT)"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Default Locale</p>
                    <span className="font-medium text-foreground">en-KE (Kenya)</span>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* SECURITY & STATUS TAB */}
          <TabsContent value="security" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Account Status Card */}
              <Card className="md:col-span-2 border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Status Transitions
                  </CardTitle>
                  <CardDescription>Activate, suspend, or deactivate customer profile access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">Access State</p>
                      <p className="text-xs text-muted-foreground">
                        {isActive 
                          ? "This customer has active platform permissions and can make orders."
                          : "This account's permissions are temporarily revoked. User cannot login."
                        }
                      </p>
                    </div>
                    <Badge variant={isActive ? "default" : "destructive"} className={isActive ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                      {isActive ? "ACTIVE ACCESS" : "SUSPENDED ACCESS"}
                    </Badge>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Administrative Controls</p>
                    
                    <div className="flex flex-wrap gap-3">
                      {isActive ? (
                        <>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            disabled={actionLoading}
                            onClick={() => handleStatusChange("suspend")}
                          >
                            <Ban className="mr-2 h-4 w-4" /> Suspend Account
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                            disabled={actionLoading}
                            onClick={() => handleStatusChange("deactivate")}
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Deactivate Account
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={actionLoading}
                          onClick={() => handleStatusChange("activate")}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Activate & Restore Access
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Diagnostics */}
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Security Status
                  </CardTitle>
                  <CardDescription>Credentials check</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">Email Verification:</span>
                    <Badge variant="outline" className={customer.is_verified ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                      {customer.is_verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">2FA Authentication:</span>
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                      Disabled
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">Account Role:</span>
                    <span className="font-mono text-xs uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-700">Customer</span>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
