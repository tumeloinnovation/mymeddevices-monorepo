'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Navigation } from 'lucide-react';

interface AddressesEmptyStateProps {
  onAdd: () => void;
}

export function AddressesEmptyState({ onAdd }: AddressesEmptyStateProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-sm">
      <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-md mx-auto">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4 border border-primary/20 shadow-xs">
          <MapPin className="h-7 w-7" />
        </div>

        <h3 className="text-base font-bold tracking-tight text-foreground">No saved addresses yet</h3>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
          Add your delivery locations for 1-click checkout. You can pinpoint exact locations using Google Maps.
        </p>

        <div className="flex items-center justify-center gap-1.5 mt-6 text-[11px] text-muted-foreground/80 pt-4 border-t border-border/50 w-full">
          <Navigation className="h-3 w-3 text-primary shrink-0" />
          <span>Real-time GPS pin location supported</span>
        </div>
      </CardContent>
    </Card>
  );
}
