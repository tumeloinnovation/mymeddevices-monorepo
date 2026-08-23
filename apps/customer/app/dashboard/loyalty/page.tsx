'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Gift,
  ShoppingBag,
  History,
  TrendingUp,
  TrendingDown,
  Crown,
  Shield,
  Award,
  Gem,
  Info,
  HelpCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLoyaltySummary, useLoyaltyLedger } from '@/lib/hooks/useLoyalty';

const tierIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  bronze: Shield,
  silver: Award,
  gold: Crown,
  platinum: Gem,
};

export default function LoyaltyPage() {
  // Fetch summary
  const { data: summary, isLoading: summaryLoading } = useLoyaltySummary();

  // Fetch ledger
  const { data: ledger, isLoading: ledgerLoading } = useLoyaltyLedger({ limit: 10 });

  if (summaryLoading || !summary) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto p-4">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const currentTierName = summary.current_tier?.name || 'Bronze';
  const tierKey = currentTierName.toLowerCase();
  const TierIcon = tierIcons[tierKey] || Shield;
  
  // Calculate discount value: 2 points = KES 1
  const kesValue = Math.floor(summary.total_points / 2);

  // Progress to next tier
  const pointsToNext = summary.points_to_next_tier || 0;
  const nextTierName = summary.next_tier?.name;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Loyalty Rewards</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Earn points automatically and redeem them as cash discounts at checkout.
        </p>
      </div>

      {/* 2. Primary Hero Stat Card */}
      <Card className="border border-border bg-card shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                <Gift className="h-4 w-4 text-emerald-500" />
                <span>Your Available Points</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground tracking-tight">
                  {summary.total_points.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground font-medium">pts</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ml-2">
                  = KES {kesValue.toLocaleString()} Checkout Discount
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted/40 border border-border shrink-0 self-start sm:self-auto">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <TierIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Tier Level</span>
                <span className="text-sm font-bold capitalize text-foreground">{currentTierName}</span>
              </div>
            </div>
          </div>

          {/* Tier Progress */}
          {nextTierName && pointsToNext > 0 && (
            <div className="mt-6 pt-4 border-t border-border/60 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progress to <strong className="text-foreground">{nextTierName}</strong></span>
                <span className="font-medium text-foreground">{pointsToNext.toLocaleString()} pts remaining</span>
              </div>
              <Progress value={Math.max(5, 100 - (pointsToNext / 1000) * 100)} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Program Rules & How to Earn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* How to Earn */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              How You Earn Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/40">
              <span className="font-medium text-foreground">Complete an Order</span>
              <span className="font-bold text-primary">1 pt / KES 100</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/40">
              <span className="font-medium text-foreground">Write a Verified Review</span>
              <span className="font-bold text-primary">+25 pts</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/40">
              <span className="font-medium text-foreground">Redemption Rate</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">2 pts = KES 1</span>
            </div>
          </CardContent>
        </Card>

        {/* Tips & Program Guidelines */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Tips & Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-muted-foreground">
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block font-medium">Automatic Checkout Discounts</strong>
                No coupon codes needed! Simply toggle "Apply Loyalty Points" on the payment summary step at checkout.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/20">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block font-medium">Tier Multipliers</strong>
                Higher tiers earn faster points! Silver earns 1.25×, Gold earns 1.5×, and Platinum earns 2× points on every purchase.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/20">
              <HelpCircle className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block font-medium">Points Validity</strong>
                Points earned remain active on your account with any purchase activity within 12 months.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Recent Activity */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Points History & Activity Log
            </span>
            <span className="text-[11px] font-normal text-muted-foreground">Last transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ledgerLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !ledger?.items || ledger.items.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No activity recorded yet. Earn points on your next purchase!
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {ledger.items.slice(0, 5).map((entry: any) => {
                const isEarn = entry.points > 0;
                return (
                  <div key={entry.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      {isEarn ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-rose-500 shrink-0" />
                      )}
                      <span className="truncate text-foreground font-medium">
                        {entry.description || (isEarn ? 'Points Earned' : 'Points Redeemed')}
                      </span>
                    </div>
                    <span className={cn("font-semibold shrink-0", isEarn ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {isEarn ? `+${entry.points}` : entry.points} pts
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
