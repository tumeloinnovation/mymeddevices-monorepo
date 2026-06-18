'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Gift, Star, TrendingUp, Award, Loader2, Gem, Medal, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { customerLoyaltyApi } from '@/lib/api/endpoints/loyalty';

const tierIcons: Record<string, React.ReactNode> = {
  bronze: <Medal className="h-5 w-5 text-amber-600" />,
  silver: <Shield className="h-5 w-5 text-slate-400" />,
  gold: <Star className="h-5 w-5 text-yellow-500" />,
  platinum: <Gem className="h-5 w-5 text-blue-400" />,
};

export default function LoyaltyPage() {
  const [redeemPoints, setRedeemPoints] = useState('');

  const { data: summary, isLoading } = useQuery({
    queryKey: ['loyalty-summary'],
    queryFn: () => customerLoyaltyApi.getSummary(),
  });

  const { data: ledger, isLoading: ledgerLoading } = useQuery({
    queryKey: ['loyalty-ledger'],
    queryFn: () => customerLoyaltyApi.getLedger({ limit: 20 }),
  });

  const redeemMutation = useMutation({
    mutationFn: (points: number) =>
      customerLoyaltyApi.redeem(points, 'Points redeemed'),
    onSuccess: () => {
      toast.success('Points redeemed successfully!');
      setRedeemPoints('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleRedeem = () => {
    const points = parseInt(redeemPoints);
    if (!points || points <= 0) {
      toast.error('Enter a valid number of points');
      return;
    }
    if (summary && points > summary.total_points) {
      toast.error('Not enough points');
      return;
    }
    redeemMutation.mutate(points);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gift className="h-6 w-6 text-primary" />
          Loyalty Program
        </h1>
        <p className="text-muted-foreground mt-1">Earn points with every purchase and enjoy exclusive benefits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold text-primary">{summary?.total_points ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-xl font-semibold capitalize">{summary?.current_tier?.name || 'Bronze'}</p>
            <p className="text-sm text-muted-foreground mt-1">Current Tier</p>
            {summary?.current_tier?.multiplier && summary.current_tier.multiplier > 1 && (
              <Badge variant="secondary" className="mt-2">{summary.current_tier.multiplier}x Points</Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            {summary?.next_tier ? (
              <>
                <p className="text-lg font-semibold">{summary.next_tier.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{summary.next_tier.points_needed} points to next tier</p>
              </>
            ) : (
              <p className="text-lg font-semibold">Highest Tier</p>
            )}
          </CardContent>
        </Card>
      </div>

      {summary && summary.next_tier && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tier Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium capitalize">{summary.current_tier.name}</span>
              <span className="text-sm font-medium">{summary.next_tier.name}</span>
            </div>
            <Progress value={summary.tier_progress} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {summary.points_to_next_tier} points needed to reach {summary.next_tier.name}
            </p>
          </CardContent>
        </Card>
      )}

      {summary?.current_tier?.benefits && summary.current_tier.benefits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.current_tier.benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500 shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Redeem Points</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="redeem-points">Points to Redeem</Label>
              <Input
                id="redeem-points"
                type="number"
                min={1}
                max={summary?.total_points || 0}
                placeholder="Enter points"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleRedeem}
                disabled={redeemMutation.isPending || !redeemPoints}
                className="gap-2"
              >
                {redeemMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Redeeming...</>
                ) : (
                  <><Gift className="h-4 w-4" /> Redeem</>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            You have {summary?.total_points ?? 0} points available
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Points History</CardTitle>
        </CardHeader>
        <CardContent>
          {ledgerLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !ledger?.items?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No points history yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {ledger.items.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={entry.transaction_type === 'earn' ? 'default' : 'secondary'} className="capitalize">
                      {entry.transaction_type}
                    </Badge>
                    <span className="text-sm">{entry.description}</span>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${entry.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {entry.points > 0 ? '+' : ''}{entry.points}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
