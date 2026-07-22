'use client';

import { useState } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAddressStore, type Address } from '@mymeddevices/core/lib/store/useAddressStore';
import { AddressCard, AddAddressCard } from './_components/address-card';
import { AddressesEmptyState } from './_components/addresses-empty-state';
import { DeleteAddressDialog } from './_components/delete-address-dialog';
import DeliveryAddressSheet from '@/components/maps/DeliveryAddressSheet';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

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

    // Check if it's a default address
    const isDefault = addresses.some(a => a.id === addressToDelete.id && a.isDefault);

    if (isDefault && addresses.length === 1) {
      // Cannot delete the only default address
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

  const handleNewAddress = (address: Address) => {
    // The DeliveryAddressSheet handles adding to the store
    // We just need to close the sheet
    setAddSheetOpen(false);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    // In a full implementation, this would open a pre-filled sheet
    // For now, we'll just show a message
    console.log('Edit address:', address);
  };

  // Get default shipping and billing addresses
  // For now, we use the single isDefault flag
  const defaultAddress = addresses.find((a: Address) => a.isDefault);

  const hasAddresses = hydrated && addresses.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Addresses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your delivery addresses for faster checkout
          </p>
        </div>
        <Button onClick={() => setAddSheetOpen(true)} className="gap-2">
          <MapPin className="h-4 w-4" />
          Add Address
        </Button>
      </div>

      {/* Content */}
      {!hydrated ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !hasAddresses ? (
        <AddressesEmptyState onAdd={() => setAddSheetOpen(true)} />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
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
          </AnimatePresence>

          {/* Add Card */}
          <div className="md:col-span-1">
            <AddAddressCard onClick={() => setAddSheetOpen(true)} />
          </div>
        </motion.div>
      )}

      {/* Add/Edit Address Sheet */}
      <DeliveryAddressSheet
        delivery={editingAddress as any}
        onSelect={handleNewAddress as any}
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
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

