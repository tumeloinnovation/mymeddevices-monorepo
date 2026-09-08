'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Trophy, Shield, Award, Crown, Gem, Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const tiers = [
  { key: 'bronze', name: 'Bronze', minPoints: 0, icon: Shield },
  { key: 'silver', name: 'Silver', minPoints: 1000, icon: Award },
  { key: 'gold', name: 'Gold', minPoints: 5000, icon: Crown },
  { key: 'platinum', name: 'Platinum', minPoints: 15000, icon: Gem },
];

interface TierProgressCardProps {
  currentPoints: number;
  currentTier: string;
  pointsToNextTier?: number;
  nextTier?: string;
  className?: string;
}

export function TierProgressCard({
  currentPoints,
  currentTier,
  pointsToNextTier = 0,
  nextTier,
  className,
}: TierProgressCardProps) {
  const currentKey = currentTier.toLowerCase();
  const currentTierIndex = Math.max(0, tiers.findIndex(t => t.key === currentKey));
  const currentTierData = tiers[currentTierIndex] || tiers[0];
  const nextTierData = nextTier ? tiers.find(t => t.key === nextTier.toLowerCase()) : tiers[currentTierIndex + 1];

  let progressPercent = 100;
  if (nextTierData && nextTierData.minPoints > currentTierData.minPoints) {
    const range = nextTierData.minPoints - currentTierData.minPoints;
    const progress = currentPoints - currentTierData.minPoints;
    progressPercent = Math.min(100, Math.max(0, (progress / range) * 100));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.2 }}
      className={className}
    >
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Trophy className="h-4 w-4 text-primary" />
            Tier Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Next Tier Progress Bar */}
          {nextTierData ? (
            <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress to {nextTierData.name}</span>
                <span className="font-semibold text-foreground">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground pt-1">
                <span className="font-medium text-foreground">{pointsToNextTier.toLocaleString()} pts</span> needed to reach {nextTierData.name} tier.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                You have reached Platinum — the highest tier!
              </p>
            </div>
          )}

          {/* Tier Steps List */}
          <div className="space-y-2">
            {tiers.map((tier, idx) => {
              const Icon = tier.icon;
              const isCurrent = tier.key === currentKey;
              const isUnlocked = idx <= currentTierIndex;

              return (
                <div
                  key={tier.key}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border text-sm transition-colors',
                    isCurrent
                      ? 'border-primary bg-primary/5 font-medium'
                      : isUnlocked
                      ? 'border-border bg-card'
                      : 'border-border/60 bg-muted/20 opacity-60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-md',
                        isCurrent
                          ? 'bg-primary text-primary-foreground'
                          : isUnlocked
                          ? 'bg-muted text-foreground'
                          : 'bg-muted/50 text-muted-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{tier.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tier.minPoints === 0 ? 'Starting level' : `${tier.minPoints.toLocaleString()}+ pts`}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isCurrent ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                        Current
                      </span>
                    ) : isUnlocked ? (
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
