'use client';

import React, { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Download,
  Info,
  Loader2,
  ArrowUpRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useEarnings, usePayouts } from '@/lib/api/hooks/useEarnings';
import { toast } from 'sonner';

export default function EarningsPage() {
  const { summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } = useEarnings();
  const { data: payoutsData, loading: payoutsLoading, requestPayout, refetch: refetchPayouts } = usePayouts({ page: 1, limit: 10 });
  const [requesting, setRequesting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleRequestPayout = async () => {
    const amount = summary?.available_for_payout || 0;
    if (amount < 5000) {
      toast.error('Minimum payout amount is KES 5,000');
      return;
    }

    if (!confirm(`Request payout of ${formatCurrency(amount)} via M-Pesa?`)) {
      return;
    }

    setRequesting(true);
    try {
      const success = await requestPayout(amount, {
        type: 'mpesa',
        details: { phone: '0712345678' }
      });
      if (success) {
        toast.success('Payout request submitted successfully!');
        await Promise.all([refetchSummary(), refetchPayouts()]);
      } else {
        toast.error('Failed to submit payout request');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error submitting payout request');
    } finally {
      setRequesting(false);
    }
  };

  if (summaryLoading || payoutsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <h2 className="font-semibold">Failed to load earnings metrics</h2>
        <p className="text-sm">Please verify the database is properly populated.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
          <p className="text-slate-500">View and manage your store revenue and payouts.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-emerald-600 text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80 text-white">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(summary?.available_for_payout || 0)}
            </div>
            <p className="text-xs mt-1 opacity-80">Ready for transfer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-slate-500">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.pending_payouts || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">In processing queue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-slate-500">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.total_earnings || 0)}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" /> Lifetime store revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-slate-500">
            <CardTitle className="text-sm font-medium">Platform Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5%</div>
            <p className="text-xs text-slate-500 mt-1">Standard medical partner rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>Records of all payments sent to you.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payout ID</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutsData?.items?.length ? (
                  payoutsData.items.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                        {payout.id.substring(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {payout.requested_at ? new Date(payout.requested_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs font-medium uppercase">{payout.method}</TableCell>
                      <TableCell className="text-right text-xs font-semibold">{formatCurrency(payout.amount)}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[10px] px-2 py-0.5",
                          payout.status === 'paid' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                          payout.status === 'processing' ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                          payout.status === 'failed' ? "bg-rose-100 text-rose-700 hover:bg-rose-100" :
                          "bg-amber-100 text-amber-700 hover:bg-amber-100"
                        )}>
                          {payout.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500 text-xs">
                      No payout records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Transfer Methods</CardTitle>
            <CardDescription>Request a manual transfer or change default details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-400">Primary Method</span>
                <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-900">Default</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-900 rounded flex items-center justify-center shrink-0">
                  <Wallet className="h-5 w-5 text-slate-650" />
                </div>
                <div>
                  <p className="text-sm font-semibold">M-Pesa (0712 *** 789)</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Verified Vendor Phone</p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-emerald-650 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5"
              onClick={handleRequestPayout}
              disabled={requesting || (summary?.available_for_payout || 0) < 5000}
            >
              {requesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
              Request Manual Payout
            </Button>

            <div className="bg-blue-50 dark:bg-blue-955/20 p-3.5 rounded-lg border border-blue-100 dark:border-blue-900 flex gap-2.5 text-xs text-blue-700 dark:text-blue-450">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Payouts are processed automatically every Monday for balances exceeding KES 5,000. Manual requests require verification.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

