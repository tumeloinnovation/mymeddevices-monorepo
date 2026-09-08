'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Sparkles,
  CheckCircle2,
  Coins,
  ArrowRight,
  Zap,
  HelpCircle,
  Clock,
  Star,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLoyaltySummary, useLoyaltyLedger } from '@/lib/hooks/useLoyalty';
import { customerLoyaltyApi } from '@/lib/api/endpoints/loyalty';
import { LoyaltyHero } from '@/app/dashboard/_components/loyalty/LoyaltyHero';
import { TierProgressCard } from '@/app/dashboard/_components/loyalty/TierProgressCard';
import { TierBenefitsCard } from '@/app/dashboard/_components/loyalty/TierBenefitsCard';
import { RewardsQuickRedeem } from '@/app/dashboard/_components/loyalty/RewardsQuickRedeem';
import { PointsHistoryTimeline } from '@/app/dashboard/_components/loyalty/PointsHistoryTimeline';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

const tierIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  bronze: Shield,
  silver: Award,
  gold: Crown,
  platinum: Gem,
};

export default function LoyaltyPage() {
  const queryClient = useQueryClient();
  const { data: summary, isLoading: summaryLoading } = useLoyaltySummary();
  const { data: ledger, isLoading: ledgerLoading } = useLoyaltyLedger({ limit: 15 });

  if (summaryLoading || !summary) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const currentTierName = summary.current_tier?.name || 'Bronze';
  const tierKey = currentTierName.toLowerCase();
  const TierIcon = tierIcons[tierKey] || Shield;

  // Calculate discount value: 2 points = KES 1
  const kesValue = Math.floor(summary.total_points / 2);
  const pointsToNext = summary.points_to_next_tier || 0;
  const nextTierName = summary.next_tier?.name;

  const handleRedeem = async (points: number, description: string) => {
    await customerLoyaltyApi.redeem(points, description);
    queryClient.invalidateQueries({ queryKey: ['loyalty-summary'] });
    queryClient.invalidateQueries({ queryKey: ['loyalty-ledger'] });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 mb-2">
            <Award className="h-3.5 w-3.5 text-amber-500" />
            <span>Healthcare Procurement Rewards Program</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Loyalty Rewards & Cash Discounts
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Earn points automatically on all medical equipment purchases and redeem them as cash discounts at checkout.
          </p>
        </div>

        <Button asChild size="sm" variant="outline" className="gap-2 rounded-xl font-semibold border-border bg-card hover:bg-muted shrink-0 self-start sm:self-auto">
          <Link href="/products">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <span>Browse Products</span>
          </Link>
        </Button>
      </div>

      {/* 2. Primary Hero Stat Card */}
      <Card className="border border-border/80 shadow-xs overflow-hidden rounded-2xl bg-card">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent border-b border-border/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                Available Rewards Balance
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                  {summary.total_points.toLocaleString()}
                </span>
                <span className="text-sm sm:text-base font-bold text-muted-foreground">pts</span>
                <Badge className="ml-2 text-xs font-bold px-3 py-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  = KES {kesValue.toLocaleString()} Store Credit
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Exchange rate: <strong>2 points = KES 1 discount</strong>. Points can be applied instantly at checkout.
              </p>
            </div>

            {/* Current Tier Badge Card */}
            <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-card/80 border border-border/80 shadow-xs shrink-0 self-start md:self-auto">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 text-amber-600 dark:text-amber-400">
                <TierIcon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground uppercase font-bold block">Current Tier</span>
                <span className="text-base font-extrabold capitalize text-foreground">{currentTierName} Member</span>
                <span className="text-[11px] text-primary font-medium block">
                  {summary.current_tier?.multiplier || 1}× Point Multiplier
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tier Progress Bar in Hero */}
        {nextTierName && pointsToNext > 0 && (
          <div className="p-5 sm:p-6 bg-muted/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Next Milestone: <strong className="text-primary">{nextTierName} Tier</strong></span>
              </span>
              <span className="font-bold text-muted-foreground">
                {pointsToNext.toLocaleString()} pts remaining
              </span>
            </div>
            <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden border border-border/40">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-primary rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(5, (1 - pointsToNext / 1000) * 100))}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* 3. Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Quick Redeem & Points Ledger (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Redeem Widget */}
          <RewardsQuickRedeem
            currentPoints={summary.total_points}
            onRedeem={handleRedeem}
          />

          {/* Points History Timeline */}
          <PointsHistoryTimeline
            entries={ledger?.items || []}
            isLoading={ledgerLoading}
          />
        </div>

        {/* Right Column: Tier Progress, Benefits & Earning Guide (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tier Milestones Card */}
          <TierProgressCard
            currentPoints={summary.total_points}
            currentTier={currentTierName}
            pointsToNextTier={pointsToNext}
            nextTier={nextTierName}
          />

          {/* Tier Benefits */}
          <TierBenefitsCard currentTier={currentTierName} />

          {/* How to Earn Points Guide */}
          <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
            <CardHeader className="py-4 px-5 border-b border-border/60 bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span>How to Earn Points</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/50">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-foreground block text-xs">Place Medical Orders</span>
                  <span className="text-muted-foreground text-[11px]">Earn 1 pt for every KES 100 spent on certified devices.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/50">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                  <Star className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-foreground block text-xs">Verified Product Reviews</span>
                  <span className="text-muted-foreground text-[11px]">Get +25 bonus points for reviewing delivered equipment.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/50">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                  <Coins className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-foreground block text-xs">Instant Checkout Deductions</span>
                  <span className="text-muted-foreground text-[11px]">Apply points during checkout for instant discounts without promo codes.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

