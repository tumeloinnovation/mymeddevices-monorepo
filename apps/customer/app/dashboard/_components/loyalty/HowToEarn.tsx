import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Star, Coins } from 'lucide-react';

export function HowToEarn() {
  return (
    <Card className="bg-muted/30 border-muted/40 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">How to Earn Points</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <ShoppingBag className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium leading-none">Make a Purchase</p>
              <p className="text-xs text-muted-foreground">1 point per KES 100 spent</p>
              <div className="flex flex-col gap-1 mt-1">
                <p className="text-[10px] text-muted-foreground">Tier Multipliers:</p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="font-medium text-amber-700/80">Bronze 1×</span>
                  <span className="font-medium text-slate-500">Silver 1.25×</span>
                  <span className="font-medium text-yellow-600">Gold 1.5×</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Platinum 2×</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Star className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium leading-none">Product Reviews</p>
              <p className="text-xs text-muted-foreground">25 bonus points per review</p>
            </div>
          </div>
          
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-start gap-3 mt-2">
              <div className="p-2 rounded-md bg-primary/10">
                <Coins className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-none">Redemption Value</p>
                <p className="text-xs text-muted-foreground">2 points = KES 1 discount at checkout</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
