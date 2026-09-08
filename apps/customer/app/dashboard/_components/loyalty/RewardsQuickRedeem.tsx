'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Gift, Loader2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// 100 points = KES 50 discount (2 pts = 1 KES)
const presetOptions = [
  { points: 100, valueKes: 50 },
  { points: 500, valueKes: 250 },
  { points: 1000, valueKes: 500 },
  { points: 2000, valueKes: 1000 },
];

interface RewardsQuickRedeemProps {
  currentPoints: number;
  onRedeem: (points: number, description: string) => Promise<void>;
  className?: string;
}

export function RewardsQuickRedeem({
  currentPoints,
  onRedeem,
  className,
}: RewardsQuickRedeemProps) {
  const [selectedPoints, setSelectedPoints] = useState<number | null>(null);
  const [customPointsInput, setCustomPointsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const executeRedeem = async (points: number) => {
    if (points <= 0) {
      toast.error('Please enter a valid points amount');
      return;
    }
    if (points > currentPoints) {
      toast.error(`Insufficient points. You currently have ${currentPoints.toLocaleString()} pts.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const discountValue = points * 0.5;
      await onRedeem(points, `Redeemed ${points} points for KES ${discountValue} store voucher`);
      setSelectedPoints(null);
      setCustomPointsInput('');
      toast.success(`Successfully redeemed ${points} points!`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to redeem points');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.2 }}
      className={className}
    >
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Gift className="h-4 w-4 text-primary" />
            Redeem Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Preset Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Quick Redeem Options</span>
              <span>2 pts = KES 1</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {presetOptions.map((opt) => {
                const isAffordable = currentPoints >= opt.points;
                const isSelected = selectedPoints === opt.points;

                return (
                  <button
                    key={opt.points}
                    type="button"
                    disabled={!isAffordable || isSubmitting}
                    onClick={() => {
                      setSelectedPoints(opt.points);
                      executeRedeem(opt.points);
                    }}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all flex flex-col justify-between h-20',
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : isAffordable
                        ? 'border-border bg-card hover:border-primary/50'
                        : 'border-border/50 bg-muted/20 opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-sm text-foreground">{opt.points} pts</span>
                      {isAffordable && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-primary">KES {opt.valueKes} Off</span>
                      <span className="text-[10px] text-muted-foreground block">Store Discount</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Redeem Input */}
          <div className="pt-3 border-t border-border space-y-2">
            <Label htmlFor="custom-pts" className="text-xs text-muted-foreground font-normal">
              Or enter custom points amount
            </Label>
            <div className="flex gap-2">
              <Input
                id="custom-pts"
                type="number"
                min="1"
                max={currentPoints}
                placeholder="e.g. 250"
                value={customPointsInput}
                onChange={(e) => setCustomPointsInput(e.target.value)}
                className="h-9 text-sm"
                disabled={isSubmitting}
              />
              <Button
                size="sm"
                disabled={isSubmitting || !customPointsInput || Number(customPointsInput) <= 0}
                onClick={() => executeRedeem(Number(customPointsInput))}
                className="h-9 px-4 text-xs shrink-0"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Redeem'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
