'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Star, CreditCard, Phone, Building2, MoreVertical, Trash2, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PaymentMethod } from '@/lib/api/endpoints/payment-methods';
import { cn } from '@/lib/utils';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSetDefault?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

/**
 * Card component for displaying payment methods
 * Supports M-Pesa, Card, and Bank transfer methods
 */
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
        return <Phone className="h-5 w-5" />;
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'bank_transfer':
        return <Building2 className="h-5 w-5" />;
    }
  };

  const getPaymentBrand = () => {
    switch (method.payment_type) {
      case 'mpesa':
        return 'M-Pesa';
      case 'card':
        return method.card_brand || 'Card';
      case 'bank_transfer':
        return method.bank_name || 'Bank Transfer';
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

  const getPaymentExpiry = () => {
    if (method.payment_type === 'card' && method.card_expiry_month && method.card_expiry_year) {
      return `Expires ${method.card_expiry_month}/${method.card_expiry_year.slice(-2)}`;
    }
    return null;
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.95, height: 0 },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      layout
    >
      <Card
        className={cn(
          'relative transition-all duration-200',
          method.is_default && 'border-primary border-2 shadow-md',
          !method.is_active && 'opacity-60'
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            {/* Icon and Details */}
            <div className="flex items-start gap-4 flex-1">
              {/* Icon */}
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full bg-primary/10',
                  method.payment_type === 'mpesa' && 'bg-green-100 dark:bg-green-900/20',
                  method.payment_type === 'card' && 'bg-blue-100 dark:bg-blue-900/20',
                  method.payment_type === 'bank_transfer' && 'bg-amber-100 dark:bg-amber-900/20'
                )}
              >
                {getPaymentIcon()}
              </div>

              {/* Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{getPaymentBrand()}</span>
                  {method.is_default && (
                    <Badge variant="default" className="gap-1 text-xs">
                      <Star className="h-3 w-3 fill-current" />
                      Default
                    </Badge>
                  )}
                  {!method.is_active && (
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{getPaymentDisplay()}</p>
                {getPaymentExpiry() && (
                  <p className="text-xs text-muted-foreground">{getPaymentExpiry()}</p>
                )}
                {method.display_name && (
                  <p className="text-xs text-muted-foreground italic">{method.display_name}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!method.is_default && (
                  <DropdownMenuItem onClick={onSetDefault} className="gap-2">
                    <Star className="h-4 w-4" />
                    Set as Default
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit} className="gap-2">
                    <Check className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={onDelete}
                  disabled={isDeleting || method.is_default}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Add new payment method card (placeholder)
 */
export function AddPaymentMethodCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer group"
        onClick={onClick}
      >
        <CardContent className="flex items-center justify-center h-full min-h-[120px]">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <p className="font-medium text-sm">Add Payment Method</p>
            <p className="text-xs text-muted-foreground">M-Pesa, Card, or Bank</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
