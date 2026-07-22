'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PaymentMethod } from '@/lib/api/endpoints/payment-methods';

interface DeletePaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  method: PaymentMethod | null;
  isLoading?: boolean;
}

/**
 * Confirmation dialog for deleting payment methods
 */
export function DeletePaymentMethodDialog({
  open,
  onOpenChange,
  onConfirm,
  method,
  isLoading = false,
}: DeletePaymentMethodDialogProps) {
  if (!method) return null;

  const getMethodDisplay = () => {
    switch (method.payment_type) {
      case 'mpesa':
        return `M-Pesa (${method.phone_number})`;
      case 'card':
        return `${method.card_brand} ending in ${method.card_last4}`;
      case 'bank_transfer':
        return `${method.bank_name} account`;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            Are you sure you want to remove{' '}
            <span className="font-semibold text-foreground">{getMethodDisplay()}</span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {method.is_default && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              This is your default payment method. You'll need to set another payment method as default
              after removing this one.
            </p>
          </motion.div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Remove
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
