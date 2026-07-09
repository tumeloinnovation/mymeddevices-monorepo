'use client';

import React, { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Info,
  Loader2,
  ArrowUpRight,
  Settings,
  CheckCircle2,
  AlertCircle
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
import { useProfile } from '@/lib/api/hooks/useProfile';
import { toast } from 'sonner';
import Link from 'next/link';

export default function EarningsPage() {
  const { summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } = useEarnings();
  const { data: payoutsData, loading: payoutsLoading, requestPayout, refetch: refetchPayouts } = usePayouts({ page: 1, limit: 10 });
  const { profile, loading: profileLoading } = useProfile();
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
        details: { phone: profile?.mpesa_phone || '0712345678' }
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

  if (summaryLoading || payoutsLoading || profileLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Check if payout details are set up
  const hasPayoutSetup = !!(profile?.mpesa_phone || profile?.bank_account_number);

  if (!hasPayoutSetup) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earnings & Payouts</h1>
          <p className="text-slate-500">Track your sales revenue, platform fees, and transfer funds.</p>
        </div>

        <Card className="border-border/50 shadow-xl overflow-hidden">
          <div className="bg-emerald-600 p-6 text-white flex items-start gap-4">
            <Wallet className="h-10 w-10 shrink-0" />
            <div>
              <CardTitle className="text-xl text-white">Payout Details Setup Required</CardTitle>
              <CardDescription className="text-emerald-105/90 mt-1 text-white">
                To activate your earnings page and receive payments, you need to configure your payout settings.
              </CardDescription>
            </div>
          </div>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Steps to Get Started:</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                <div>
                  <p className="text-sm font-semibold">Navigate to Store Settings</p>
                  <p className="text-xs text-slate-550">Click the button below or go to Settings in the navigation menu.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                <div>
                  <p className="text-sm font-semibold">Provide Payout Account Information</p>
                  <p className="text-xs text-slate-550">Enter either your M-Pesa phone number or complete bank account details under the Payout Details card.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                <div>
                  <p className="text-sm font-semibold">Save Payout Configuration</p>
                  <p className="text-xs text-slate-550">Click Save to store details. Payouts will be generated to the default payout method once balance exceeds KES 5,000.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button asChild className="bg-emerald-650 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2">
                <Link href="/vendor/settings/profile">
                  <Settings className="h-4 w-4" />
                  Configure Payout Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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

      {summaryError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 flex gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <h2 className="font-semibold text-sm">Earnings Metrics Unavailable</h2>
            <p className="text-xs mt-0.5 text-amber-700">
              No sales transactions or payout metrics have been generated yet for your vendor store. Ensure you have published active products and received orders.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-emerald-650 text-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-85 text-white">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              {formatCurrency(summary?.available_for_payout || 0)}
            </div>
            <p className="text-xs mt-1 opacity-80">Ready for transfer</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md">
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
        <Card className="border-border/50 shadow-md">
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
        <Card className="border-border/50 shadow-md">
          <CardHeader className="pb-2 text-slate-500">
            <CardTitle className="text-sm font-medium">Platform Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5%</div>
            <p className="text-xs text-slate-500 mt-1">Standard medical partner rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>Records of all payments sent to you.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                        <TableCell className="font-semibold text-xs text-emerald-655 dark:text-emerald-400">
                          {payout.id.substring(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-xs text-slate-550">
                          {payout.requested_at ? new Date(payout.requested_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs font-semibold uppercase">{payout.method}</TableCell>
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
                      <TableCell colSpan={5} className="h-24 text-center text-slate-550 text-xs">
                        No payout records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Transfer Methods</CardTitle>
            <CardDescription>Request a manual transfer or view default details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-400">Primary Method</span>
                <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-900 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Default
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-900 rounded flex items-center justify-center shrink-0">
                  <Wallet className="h-5 w-5 text-emerald-650" />
                </div>
                <div>
                  {profile?.mpesa_phone ? (
                    <>
                      <p className="text-sm font-semibold">M-Pesa ({profile.mpesa_phone.slice(0, 4)} *** {profile.mpesa_phone.slice(-3)})</p>
                      <p className="text-[10px] text-emerald-600 font-medium">Verified Phone Payout</p>
                    </>
                  ) : profile?.bank_account_number ? (
                    <>
                      <p className="text-sm font-semibold">{profile.bank_name} Account</p>
                      <p className="text-[10px] text-emerald-600 font-medium">Account: **** {profile.bank_account_number.slice(-4)}</p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold">No payout method configured</p>
                  )}
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
