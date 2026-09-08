'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Gift, TrendingUp, Award, Crown, Shield, Gem, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tierIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  bronze: Shield,
  silver: Award,
  gold: Crown,
  platinum: Gem,
};

interface LoyaltyHeroProps {
  totalPoints: number;
  currentTier: string;
  earnedPoints?: number;
  className?: string;
}

export function LoyaltyHero({
  totalPoints,
  currentTier,
  earnedPoints = 0,
  className,
}: LoyaltyHeroProps) {
  const tierKey = currentTier.toLowerCase();
  const TierIcon = tierIcons[tierKey] || Shield;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card className="overflow-hidden border border-border bg-card shadow-sm">
        <CardContent className="p-0">
          {/* Header Banner */}
          <div className="bg-slate-900 dark:bg-zinc-900 text-slate-50 p-6 rounded-t-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Main Balance */}
              <div>
                <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs font-medium uppercase tracking-wider">
                  <Gift className="h-4 w-4 text-emerald-400" />
                  <span>Points Balance</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  {totalPoints.toLocaleString()}{' '}
                  <span className="text-base font-normal text-slate-400">pts</span>
                </h2>
              </div>

              {/* Tier Pill */}
              <div className="flex items-center gap-3 px-3.5 py-2 rounded-lg bg-slate-800/80 border border-slate-700/60 self-start sm:self-auto">
                <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400">
                  <TierIcon className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Current Tier</span>
                  <span className="text-white font-medium capitalize text-sm">{currentTier} Member</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 divide-x divide-border bg-muted/20 border-t border-border">
            <div className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lifetime Points</p>
                <p className="font-semibold text-sm text-foreground">{earnedPoints.toLocaleString()} pts</p>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Checkout Rate</p>
                <p className="font-semibold text-sm text-foreground">2 pts = KES 1</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
