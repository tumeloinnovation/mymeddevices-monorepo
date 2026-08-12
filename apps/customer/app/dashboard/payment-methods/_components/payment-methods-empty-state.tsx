'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, ShieldCheck } from 'lucide-react';

interface PaymentMethodsEmptyStateProps {
  onAdd: () => void;
}

export function PaymentMethodsEmptyState({ onAdd }: PaymentMethodsEmptyStateProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-sm">
      <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-md mx-auto">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4 border border-primary/20 shadow-xs">
          <CreditCard className="h-7 w-7" />
        </div>

        <h3 className="text-base font-bold tracking-tight text-foreground">No payment methods saved</h3>
        <p className="text-xs text-muted-foreground mt-1.5 mb-6 max-w-xs leading-relaxed">
          Save your M-Pesa phone number, debit/credit cards, or bank accounts for express checkout.
        </p>

        <Button onClick={onAdd} size="sm" className="gap-2 text-xs font-medium h-9 px-4">
          <Plus className="h-4 w-4" />
          Add Payment Method
        </Button>

        <div className="flex items-center justify-center gap-1.5 mt-6 text-[11px] text-muted-foreground/80 pt-4 border-t border-border/50 w-full">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span>PCI-DSS 256-bit encrypted checkout guarantee</span>
        </div>
      </CardContent>
    </Card>
  );
}
