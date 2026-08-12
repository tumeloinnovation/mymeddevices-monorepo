'use client';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ShieldCheck } from 'lucide-react';
import { usePaymentMethods, useSetDefaultPaymentMethod, useDeletePaymentMethod } from '@/lib/hooks/usePaymentMethods';
import { PaymentMethodCard } from './_components/payment-method-card';
import { PaymentMethodsEmptyState } from './_components/payment-methods-empty-state';
import { AddPaymentMethodDialog } from './_components/add-payment-method-dialog';
import { EditPaymentMethodSheet } from './_components/edit-payment-method-sheet';
import { DeletePaymentMethodDialog } from './_components/delete-payment-method-dialog';
import type { PaymentMethod } from '@/lib/api/endpoints/payment-methods';

function PaymentMethodsPageContent() {
  const { data: paymentMethods, isLoading } = usePaymentMethods();
  const setDefault = useSetDefaultPaymentMethod();
  const deleteMethod = useDeletePaymentMethod();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [methodToEdit, setMethodToEdit] = useState<PaymentMethod | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);

  const handleSetDefault = async (methodId: string) => {
    try {
      await setDefault.mutateAsync(methodId);
    } catch {
      // Error handled by mutation
    }
  };

  const handleEditClick = (method: PaymentMethod) => {
    setMethodToEdit(method);
    setEditSheetOpen(true);
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

  const handleEditSheetChange = (open: boolean) => {
    setEditSheetOpen(open);
    if (!open) {
      setMethodToEdit(null);
    }
  };

  const hasMethods = paymentMethods && paymentMethods.length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Payment Methods</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage saved M-Pesa numbers, debit/credit cards, and bank details.
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2 shrink-0 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Payment Method
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !hasMethods ? (
        <PaymentMethodsEmptyState onAdd={() => setAddDialogOpen(true)} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                onSetDefault={() => handleSetDefault(method.id)}
                onEdit={() => handleEditClick(method)}
                onDelete={() => handleDeleteClick(method)}
                isDeleting={deleteMethod.isPending}
              />
            ))}
          </div>

          {/* Quick Security Badge */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>All payment methods are encrypted and processed through PCI-DSS compliant gateways.</span>
          </div>
        </div>
      )}

      {/* Dialogs / Sheets */}
      <AddPaymentMethodDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      <EditPaymentMethodSheet
        open={editSheetOpen}
        onOpenChange={handleEditSheetChange}
        method={methodToEdit}
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
