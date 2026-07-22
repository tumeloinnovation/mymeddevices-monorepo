'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LoyaltyProgressBarProps {
  currentTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  currentPoints?: number;
  nextTierPoints?: number;
  className?: string;
}

const tierConfig = {
  bronze: { name: 'Bronze', color: 'from-amber-600 to-amber-800', bgColor: 'bg-amber-100 dark:bg-amber-900/30', textColor: 'text-amber-700 dark:text-amber-300' },
  silver: { name: 'Silver', color: 'from-gray-400 to-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/30', textColor: 'text-gray-700 dark:text-gray-300' },
  gold: { name: 'Gold', color: 'from-yellow-500 to-yellow-700', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-700 dark:text-yellow-300' },
  platinum: { name: 'Platinum', color: 'from-slate-300 to-slate-500', bgColor: 'bg-slate-100 dark:bg-slate-900/30', textColor: 'text-slate-700 dark:text-slate-300' },
};

const tierProgress = {
  bronze: { nextTier: 'silver', required: 100 },
  silver: { nextTier: 'gold', required: 500 },
  gold: { nextTier: 'platinum', required: 1000 },
  platinum: { nextTier: null, required: null },
};

/**
 * Loyalty tier progress bar
 * Shows current tier, progress to next tier, and points needed
 */
export function LoyaltyProgressBar({
  currentTier = 'bronze',
  currentPoints = 0,
  nextTierPoints,
  className,
}: LoyaltyProgressBarProps) {
  const config = tierConfig[currentTier];
  const progress = tierProgress[currentTier];
  const nextTierConfig = progress?.nextTier ? tierConfig[progress.nextTier as keyof typeof tierConfig] : null;

  // Calculate progress percentage
  const tierRequired = progress?.required || 100;
  const tierProgress = Math.min((currentPoints / tierRequired) * 100, 100);
  const pointsRemaining = Math.max(tierRequired - currentPoints, 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(className)}
    >
      <Card className={config.bgColor}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Trophy Icon */}
            <motion.div
              className="p-2 rounded-full bg-gradient-to-br opacity-90"
              style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to))` }}
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <Trophy className="h-5 w-5 text-white" />
            </motion.div>

            <div className="flex-1 space-y-2">
              {/* Tier Badge and Progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn('font-semibold', config.textColor)}>
                    🏆 {config.name} Tier
                  </span>
                  {nextTierConfig && (
                    <span className="text-sm text-muted-foreground">
                      · {pointsRemaining}pts to {nextTierConfig.name}
                    </span>
                  )}
                </div>
                {!progress?.nextTier && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    Highest tier!
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {progress?.nextTier && (
                <div className="space-y-1">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', config.color.replace('from-', 'bg-').replace(' to-', ' '))}
                      initial={{ width: 0 }}
                      animate={{ width: `${tierProgress}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(tierProgress)}% to {nextTierConfig?.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
