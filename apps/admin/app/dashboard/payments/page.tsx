"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Smartphone,
  BarChart3,
  RefreshCw,
  Settings,
  Search,
  Filter,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import PaymentMethods from "./payment-methods";
import TransactionHistory from "./transaction-history";
import PaymentAnalytics from "./payment-analytics";
import RefundManagement from "./refund-management";

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-600">
              Payments
            </h1>
            <p className="text-muted-foreground">
              Manage payment methods, transactions, analytics, and refunds.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="refunds" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refunds
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Methods
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PaymentAnalytics />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <TransactionHistory />
          </TabsContent>

          <TabsContent value="refunds" className="space-y-6">
            <RefundManagement />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <PaymentMethods />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
