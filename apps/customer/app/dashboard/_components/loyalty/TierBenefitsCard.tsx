'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { CheckCircle2, Lock, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

const tierBenefitsMap: Record<string, string[]> = {
  bronze: ['5% bonus points on purchases', 'Basic membership perks', 'Standard customer support'],
  silver: ['10% bonus points on purchases', 'All Bronze benefits', 'Early access to flash sales', 'Priority customer support'],
  gold: ['15% bonus points on purchases', 'All Silver benefits', 'Free shipping on orders over KES 5,000', 'Dedicated support line'],
  platinum: ['20% bonus points on purchases', 'All Gold benefits', 'Free shipping on all orders', 'Dedicated account manager', 'Exclusive product previews'],
};

interface TierBenefitsCardProps {
  currentTier: string;
  className?: string;
}

export function TierBenefitsCard({ currentTier, className }: TierBenefitsCardProps) {
  const currentKey = currentTier.toLowerCase();
  const currentBenefits = tierBenefitsMap[currentKey] || tierBenefitsMap.bronze;

  const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIdx = tierOrder.indexOf(currentKey);
  const nextTierKey = tierOrder[currentIdx + 1];
  const nextBenefits = nextTierKey ? tierBenefitsMap[nextTierKey] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.2 }}
      className={className}
    >
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-base font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              Tier Benefits
            </span>
            <Badge variant="outline" className="capitalize font-normal text-xs">
              {currentTier}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active Benefits */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Unlocked Perks
            </p>
            <div className="space-y-2">
              {currentBenefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 p-2.5 rounded-md bg-muted/30 border border-border/50 text-xs text-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Tier Perks Preview */}
          {nextTierKey && nextBenefits && (
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                  Upcoming ({nextTierKey})
                </span>
                <Lock className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="space-y-1.5 opacity-70">
                {nextBenefits.slice(0, 3).map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/20 text-xs text-muted-foreground"
                  >
                    <Lock className="h-3 w-3 shrink-0" />
                    <span className="line-clamp-1">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
