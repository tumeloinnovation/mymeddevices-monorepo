"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Store,
  UserCog,
  ArrowRight,
  Plus,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { usersService, type UserStats, type Customer, type VendorOverview } from "@mymeddevices/shared-core";

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href: string;
  description: string;
  trend?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const statCardsConfig: Omit<StatCard, "value" | "trend">[] = [
  {
    title: "Total Customers",
    icon: <Users className="h-5 w-5 text-blue-500" />,
    href: "/dashboard/users/customers",
    description: "Registered customer accounts",
    variant: "default",
  },
  {
    title: "Active Vendors",
    icon: <Store className="h-5 w-5 text-emerald-500" />,
    href: "/dashboard/vendors",
    description: "Approved vendor accounts",
    variant: "success",
  },
  {
    title: "Staff Members",
    icon: <UserCog className="h-5 w-5 text-purple-500" />,
    href: "/dashboard/users/staff",
    description: "Admin and worker accounts",
    variant: "default",
  },
  {
    title: "Pending Approvals",
    icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
    href: "/dashboard/vendors",
    description: "Vendors awaiting approval",
    variant: "warning",
  },
];

export default function UsersOverviewPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [pendingVendors, setPendingVendors] = useState<VendorOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // Load stats
        const statsData = await usersService.getStats();
        setStats(statsData);

        // Load recent customers
        const customersData = await usersService.getCustomers({
          page: 1,
          page_size: 3,
          status_filter: "active"
        });
        setRecentCustomers(customersData.customers);

        // Load pending vendors
        const vendorsData = await usersService.getVendorsOverview({
          page: 1,
          page_size: 3,
          status_filter: "pending"
        });
        setPendingVendors(vendorsData.vendors);
      } catch (err: any) {
        console.error("Failed to load user stats", err);
        setError(err.message || "Failed to load data");
        // Set fallback data
        setStats({
          total_customers: 0,
          active_customers: 0,
          total_vendors: 0,
          active_vendors: 0,
          pending_vendors: 0,
          total_staff: 0,
          active_staff: 0,
          new_this_month: 0,
          active_today: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
            <p className="text-muted-foreground">
              Manage customers, vendors, and staff accounts across the platform.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/users/customers">
                <Users className="mr-2 h-4 w-4" /> View Customers
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/vendors">
                <Plus className="mr-2 h-4 w-4" /> Add Vendor
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">⚠️ {error}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCardsConfig.map((card, i) => {
            const value = stats ? (
              i === 0 ? stats.total_customers :
              i === 1 ? stats.active_vendors :
              i === 2 ? stats.total_staff : stats.pending_vendors
            ) : 0;

            const trends = stats ? [
              stats.new_this_month > 0 && (
                <span key="customers" className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> +{stats.new_this_month} this month
                </span>
              ),
              <span key="vendors" className="text-xs text-green-600 flex items-center gap-1">
                <Activity className="h-3 w-3" /> {stats.total_vendors} total
              </span>,
              null,
              stats.pending_vendors > 0 ? (
                <span key="pending" className="text-xs text-amber-600 flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Action needed
                </span>
              ) : null,
            ] : [];

            return (
              <Card key={card.title} className={card.variant === "warning" && (stats?.pending_vendors ?? 0) > 0 ? "border-amber-200" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  {card.icon}
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="text-2xl font-bold">{value}</div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                  {trends[i] && <div className="mt-2">{trends[i]}</div>}
                  <Button variant="ghost" size="sm" className="mt-4 w-full justify-between" asChild>
                    <Link href={card.href}>
                      View Details
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>Latest customer registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No customers yet</p>
              ) : (
                <div className="space-y-3">
                  {recentCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {customer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                      <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                        {customer.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="ghost" size="sm" className="mt-4 w-full justify-between" asChild>
                <Link href="/dashboard/users/customers">
                  View All Customers
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Vendor Approvals</CardTitle>
              <CardDescription>Vendors awaiting review</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))}
                </div>
              ) : pendingVendors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No pending approvals</p>
              ) : (
                <div className="space-y-3">
                  {pendingVendors.map((vendor) => (
                    <div key={vendor.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{vendor.name || vendor.company_name}</p>
                        <p className="text-xs text-muted-foreground">{vendor.email}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                        <Link href={`/dashboard/vendors/${vendor.id}`}>
                          Review
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="ghost" size="sm" className="mt-4 w-full justify-between" asChild>
                <Link href="/dashboard/vendors">
                  View All Vendors
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common user management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/dashboard/users/customers">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Customers
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/dashboard/vendors">
                    <Store className="mr-2 h-4 w-4" />
                    Manage Vendors
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/dashboard/users/staff">
                    <UserCog className="mr-2 h-4 w-4" />
                    Manage Staff
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/dashboard/users/staff">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Staff Member
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Activity Overview</CardTitle>
            <CardDescription>Platform-wide user engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                ))}
              </div>
            ) : stats ? (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold">{stats.active_today}</p>
                  <p className="text-xs text-green-600">Currently active</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">New This Month</p>
                  <p className="text-2xl font-bold">{stats.new_this_month}</p>
                  <p className="text-xs text-green-600">New registrations</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Active Customers</p>
                  <p className="text-2xl font-bold">{stats.active_customers}</p>
                  <p className="text-xs text-muted-foreground">of {stats.total_customers} total</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Active Staff</p>
                  <p className="text-2xl font-bold">{stats.active_staff}</p>
                  <p className="text-xs text-muted-foreground">of {stats.total_staff} total</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
