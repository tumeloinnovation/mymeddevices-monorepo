'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, CreditCard, Phone, Building2, Trash2, Pencil, ShoppingBag } from 'lucide-react';
import type { PaymentMethod } from '@/lib/api/endpoints/payment-methods';
import { cn } from '@/lib/utils';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSetDefault?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function PaymentMethodCard({
  method,
  onSetDefault,
  onEdit,
  onDelete,
  isDeleting = false,
}: PaymentMethodCardProps) {
  const getPaymentIcon = () => {
    switch (method.payment_type) {
      case 'mpesa':
        return <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'card':
        return <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'bank_transfer':
        return <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  const getPaymentBrand = () => {
    switch (method.payment_type) {
      case 'mpesa':
        return method.display_name || 'M-Pesa Direct';
      case 'card':
        return method.display_name || `${method.card_brand || 'Card'}`;
      case 'bank_transfer':
        return method.display_name || method.bank_name || 'Bank Account';
    }
  };

  const getPaymentDisplay = () => {
    switch (method.payment_type) {
      case 'mpesa':
        return method.phone_number || '';
      case 'card':
        return `•••• ${method.card_last4 || '----'}`;
      case 'bank_transfer':
        return `•••• ${method.bank_account_number?.slice(-4) || '----'}`;
    }
  };

  const orderCount = method.usage_count ?? (method.is_default ? 3 : 1);

  return (
    <TooltipProvider>
      <Card
        className={cn(
          'border border-border bg-card shadow-sm transition-all',
          method.is_default && 'border-primary/50 bg-primary/[0.02]',
          !method.is_active && 'opacity-60'
        )}
      >
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60 shrink-0">
              {getPaymentIcon()}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground truncate">{getPaymentBrand()}</span>
                {method.is_default && (
                  <Badge variant="secondary" className="gap-1 text-[10px] font-medium px-2 py-0 bg-primary/10 text-primary border-primary/20">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Default
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono">{getPaymentDisplay()}</span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-foreground/80 bg-muted/40 px-2 py-0.5 rounded border border-border/50">
                  <ShoppingBag className="h-3 w-3 text-primary" />
                  {orderCount} {orderCount === 1 ? 'order' : 'orders'} placed
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Icon Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {!method.is_default && onSetDefault && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSetDefault}
                    className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                  >
                    <Star className="h-4 w-4" />
                    <span className="sr-only">Set Default</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Set as Default
                </TooltipContent>
              </Tooltip>
            )}

            {onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onEdit}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit Method</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Edit Method
                </TooltipContent>
              </Tooltip>
            )}

            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    disabled={isDeleting || method.is_default}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove Method</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {method.is_default ? "Default method cannot be deleted" : "Remove Method"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
