'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Navigation, ShieldCheck, Hospital } from 'lucide-react';

interface AddressesEmptyStateProps {
  onAdd: () => void;
}

export function AddressesEmptyState({ onAdd }: AddressesEmptyStateProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-xs rounded-2xl overflow-hidden">
      <CardContent className="flex flex-col items-center justify-center p-8 sm:p-14 text-center max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/20 to-emerald-500/10 text-primary border border-primary/25 shadow-xs">
          <MapPin className="h-8 w-8 animate-bounce" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold tracking-tight text-foreground">No Delivery Locations Saved</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Save your hospital, clinic, practice, or residential address for quick procurement and expedited courier dispatch across Kenya.
          </p>
        </div>

        <Button
          onClick={onAdd}
          className="rounded-xl font-semibold gap-2 shadow-xs mt-2"
        >
          <Plus className="h-4 w-4" />
          Add Your First Address
        </Button>

        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-4 border-t border-border/60 w-full">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span>Google Maps verified GPS pin coordinates supported</span>
        </div>
      </CardContent>
    </Card>
  );
}
