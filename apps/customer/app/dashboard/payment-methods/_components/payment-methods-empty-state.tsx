'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentMethodsEmptyStateProps {
  onAdd: () => void;
}

/**
 * Empty state for payment methods page
 * Shows when user has no payment methods saved
 */
export function PaymentMethodsEmptyState({ onAdd }: PaymentMethodsEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <Card className="w-full max-w-md p-8 text-center">
        {/* Illustration */}
        <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-full bg-primary/5">
          <CreditCard className="h-12 w-12 text-muted-foreground" />
        </div>

        {/* Message */}
        <h3 className="text-xl font-semibold mb-2">No payment methods yet</h3>
        <p className="text-muted-foreground mb-6">
          Add a payment method for faster checkout. We support M-Pesa, cards, and bank transfers.
        </p>

        {/* CTA */}
        <Button onClick={onAdd} className="gap-2">
          <CreditCard className="h-4 w-4" />
          Add Payment Method
        </Button>

        {/* Security notice */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span>Your payment information is encrypted and secure</span>
        </div>
      </Card>
    </motion.div>
  );
}
