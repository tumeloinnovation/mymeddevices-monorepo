"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Smartphone,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface SummaryData {
  total_transactions: number;
  total_amount: number;
  total_fees: number;
  successful_transactions: number;
  successful_amount: number;
  failed_transactions: number;
  pending_transactions: number;
  refunded_amount: number;
  today_transactions: number;
  today_amount: number;
  today_successful: number;
  success_rate: number;
  average_transaction_value: number;
}

export default function PaymentAnalytics() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/payments/analytics/summary");
      if (!response.ok) throw new Error("Failed to fetch summary");

      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Failed to load payment summary:", error);
      toast.error("Failed to load payment summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const StatCard = ({
    title,
    value,
    change,
    changeType,
    icon: Icon,
    prefix = "",
    suffix = "",
  }: {
    title: string;
    value: number | string;
    change?: number;
    changeType?: "up" | "down" | "neutral";
    icon: any;
    prefix?: string;
    suffix?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
        </div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {changeType === "up" ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-600" />
            ) : changeType === "down" ? (
              <ArrowDownRight className="h-3 w-3 text-red-600" />
            ) : null}
            <span className={changeType === "up" ? "text-emerald-600" : changeType === "down" ? "text-red-600" : ""}>
              {change > 0 ? "+" : ""}{change}%
            </span>
            <span>from last period</span>
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Unable to load analytics data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const successPercentage = summary.total_transactions > 0
    ? (summary.successful_transactions / summary.total_transactions) * 100
    : 0;
  const failedPercentage = summary.total_transactions > 0
    ? (summary.failed_transactions / summary.total_transactions) * 100
    : 0;
  const pendingPercentage = summary.total_transactions > 0
    ? (summary.pending_transactions / summary.total_transactions) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payment Analytics</h2>
          <p className="text-muted-foreground">
            Overview of payment performance and metrics.
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchSummary} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={summary.total_amount}
          prefix="KES "
          change={12.5}
          changeType="up"
          icon={DollarSign}
        />
        <StatCard
          title="Total Transactions"
          value={summary.total_transactions}
          change={8.2}
          changeType="up"
          icon={Activity}
        />
        <StatCard
          title="Success Rate"
          value={`${summary.success_rate}%`}
          change={2.1}
          changeType="up"
          icon={CheckCircle2}
        />
        <StatCard
          title="Avg Transaction"
          value={summary.average_transaction_value}
          prefix="KES "
          change={-3.4}
          changeType="down"
          icon={CreditCard}
        />
      </div>

      {/* Transaction Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.successful_transactions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              KES {summary.successful_amount.toLocaleString()}
            </p>
            <Progress value={successPercentage} className="mt-3" />
            <p className="text-xs text-muted-foreground mt-1">{successPercentage.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.failed_transactions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {failedPercentage.toFixed(1)}% of total
            </p>
            <Progress value={failedPercentage} className="mt-3" />
            <p className="text-xs text-muted-foreground mt-1">{failedPercentage.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pending_transactions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting completion
            </p>
            <Progress value={pendingPercentage} className="mt-3" />
            <p className="text-xs text-muted-foreground mt-1">{pendingPercentage.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Performance
          </CardTitle>
          <CardDescription>
            Real-time payment activity for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Today's Transactions</p>
              <p className="text-3xl font-bold mt-1">{summary.today_transactions}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.today_successful} successful
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Revenue</p>
              <p className="text-3xl font-bold mt-1">
                KES {summary.today_amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Fees Collected</p>
              <p className="text-3xl font-bold mt-1">
                KES {summary.total_fees.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refunds */}
      {summary.refunded_amount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Refunds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Refunded</p>
                <p className="text-2xl font-bold text-red-600">
                  KES {summary.refunded_amount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
