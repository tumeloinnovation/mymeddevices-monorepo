'use client';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePaymentMethods, useSetDefaultPaymentMethod, useDeletePaymentMethod } from '@/lib/hooks/usePaymentMethods';
import { PaymentMethodCard, AddPaymentMethodCard } from './_components/payment-method-card';
import { PaymentMethodsEmptyState } from './_components/payment-methods-empty-state';
import { AddPaymentMethodDialog } from './_components/add-payment-method-dialog';
import { DeletePaymentMethodDialog } from './_components/delete-payment-method-dialog';
import { Loader2, CreditCard } from 'lucide-react';
import type { PaymentMethod } from '@/lib/api/endpoints/payment-methods';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function PaymentMethodsPageContent() {
  const { data: paymentMethods, isLoading } = usePaymentMethods();
  const setDefault = useSetDefaultPaymentMethod();
  const deleteMethod = useDeletePaymentMethod();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);

  const handleSetDefault = async (methodId: string) => {
    try {
      await setDefault.mutateAsync(methodId);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteClick = (method: PaymentMethod) => {
    setMethodToDelete(method);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!methodToDelete) return;

    try {
      await deleteMethod.mutateAsync(methodToDelete.id);
      setDeleteDialogOpen(false);
      setMethodToDelete(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setMethodToDelete(null);
    }
  };

  // Group methods by type (M-Pesa first, then cards, then banks)
  const groupedMethods = {
    mpesa: paymentMethods?.filter((m) => m.payment_type === 'mpesa') || [],
    card: paymentMethods?.filter((m) => m.payment_type === 'card') || [],
    bank: paymentMethods?.filter((m) => m.payment_type === 'bank_transfer') || [],
  };

  const hasMethods = paymentMethods && paymentMethods.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Methods</h1>
          <p className="text-muted-foreground mt-1">
            Manage your payment options for faster checkout
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <CreditCard className="h-4 w-4" />
          Add Payment Method
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !hasMethods ? (
        <PaymentMethodsEmptyState onAdd={() => setAddDialogOpen(true)} />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* M-Pesa Section */}
          {groupedMethods.mpesa.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">M-Pesa</span>
                <span className="text-sm text-muted-foreground font-normal">
                  ({groupedMethods.mpesa.length})
                </span>
              </h3>
              <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                  {groupedMethods.mpesa.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      method={method}
                      onSetDefault={() => handleSetDefault(method.id)}
                      onDelete={() => handleDeleteClick(method)}
                      isDeleting={deleteMethod.isPending}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Cards Section */}
          {groupedMethods.card.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>Cards</span>
                <span className="text-sm text-muted-foreground font-normal">
                  ({groupedMethods.card.length})
                </span>
              </h3>
              <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                  {groupedMethods.card.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      method={method}
                      onSetDefault={() => handleSetDefault(method.id)}
                      onDelete={() => handleDeleteClick(method)}
                      isDeleting={deleteMethod.isPending}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Bank Transfers Section */}
          {groupedMethods.bank.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>Bank Accounts</span>
                <span className="text-sm text-muted-foreground font-normal">
                  ({groupedMethods.bank.length})
                </span>
              </h3>
              <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                  {groupedMethods.bank.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      method={method}
                      onSetDefault={() => handleSetDefault(method.id)}
                      onDelete={() => handleDeleteClick(method)}
                      isDeleting={deleteMethod.isPending}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Add Card */}
          <AddPaymentMethodCard onClick={() => setAddDialogOpen(true)} />
        </motion.div>
      )}

      {/* Security Notice */}
      {hasMethods && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground border-t"
        >
          <Lock className="h-3 w-3" />
          <span>Your payment information is encrypted and secure</span>
        </motion.div>
      )}

      {/* Dialogs */}
      <AddPaymentMethodDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      <DeletePaymentMethodDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        onConfirm={handleDeleteConfirm}
        method={methodToDelete}
        isLoading={deleteMethod.isPending}
      />
    </div>
  );
}

export default function PaymentMethodsPage() {
  return (
    <ErrorBoundary>
      <PaymentMethodsPageContent />
    </ErrorBoundary>
  );
}

