'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { History, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LedgerEntry {
  id: string;
  points: number;
  transaction_type: string;
  description?: string;
  created_at: string;
  balance_after: number;
}

interface PointsHistoryTimelineProps {
  entries?: LedgerEntry[];
  isLoading?: boolean;
  className?: string;
}

export function PointsHistoryTimeline({
  entries = [],
  isLoading,
  className,
}: PointsHistoryTimelineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.2 }}
      className={className}
    >
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-base font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Points Activity History
            </span>
            <Badge variant="secondary" className="font-normal text-xs">
              {entries.length} {entries.length === 1 ? 'record' : 'records'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground space-y-1">
              <p className="text-sm font-medium text-foreground">No points history yet</p>
              <p className="text-xs">Points earned from purchases and reviews will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {entries.map((entry) => {
                const isEarn = entry.points > 0;
                const formattedDate = new Date(entry.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div key={entry.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-md shrink-0',
                          isEarn
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        )}
                      >
                        {isEarn ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {entry.description || (isEarn ? 'Earned Points' : 'Redeemed Points')}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{formattedDate}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={cn(
                          'text-sm font-bold',
                          isEarn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        )}
                      >
                        {isEarn ? `+${entry.points}` : entry.points} pts
                      </p>
                      <p className="text-[11px] text-muted-foreground">Bal: {entry.balance_after} pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
