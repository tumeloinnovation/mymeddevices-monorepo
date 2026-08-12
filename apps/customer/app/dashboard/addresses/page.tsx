'use client';

import { useState } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useAddressStore, type Address } from '@mymeddevices/core/lib/store/useAddressStore';
import { AddressCard } from './_components/address-card';
import { AddressesEmptyState } from './_components/addresses-empty-state';
import { DeleteAddressDialog } from './_components/delete-address-dialog';
import DeliveryAddressSheet from '@/components/maps/DeliveryAddressSheet';

function AddressesPage() {
  const { addresses, hydrated, removeAddress, setDefaultAddress } = useAddressStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null | undefined>(undefined);

  const handleDeleteClick = (address: Address) => {
    setAddressToDelete(address);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!addressToDelete) return;

    const isDefault = addresses.some(a => a.id === addressToDelete.id && a.isDefault);

    if (isDefault && addresses.length === 1) {
      return;
    }

    removeAddress(addressToDelete.id);
    setDeleteDialogOpen(false);
    setAddressToDelete(null);
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setAddressToDelete(null);
    }
  };

  const handleSetDefault = (addressId: string) => {
    setDefaultAddress(addressId);
  };

  const handleNewAddress = () => {
    setAddSheetOpen(false);
    setEditingAddress(undefined);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddSheetOpen(true);
  };

  const hasAddresses = hydrated && addresses.length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Addresses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your saved shipping & billing delivery locations.
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingAddress(undefined);
            setAddSheetOpen(true);
          }} 
          className="gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add New Address
        </Button>
      </div>

      {/* Content */}
      {!hydrated ? (
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !hasAddresses ? (
        <AddressesEmptyState onAdd={() => {
          setEditingAddress(undefined);
          setAddSheetOpen(true);
        }} />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              isDefaultShipping={address.isDefault}
              isDefaultBilling={address.isDefault}
              onSetDefaultShipping={() => handleSetDefault(address.id!)}
              onEdit={() => handleEditAddress(address)}
              onDelete={() => handleDeleteClick(address)}
            />
          ))}
        </div>
      )}

      {/* Delivery Address Google Maps Sheet */}
      <DeliveryAddressSheet
        delivery={editingAddress as any}
        onSelect={handleNewAddress as any}
        open={addSheetOpen}
        onOpenChange={(open) => {
          setAddSheetOpen(open);
          if (!open) setEditingAddress(undefined);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteAddressDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        onConfirm={handleDeleteConfirm}
        address={addressToDelete}
        isDefaultShipping={addressToDelete?.isDefault}
        isDefaultBilling={addressToDelete?.isDefault}
      />
    </div>
  );
}

export default function AddressesPageWrapper() {
  return (
    <ErrorBoundary>
      <AddressesPage />
    </ErrorBoundary>
  );
}
