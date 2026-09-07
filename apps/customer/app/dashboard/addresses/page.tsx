'use client';

import { useState } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Loader2,
  MapPin,
  ShieldCheck,
  Building2,
  Truck,
  Sparkles,
} from 'lucide-react';
import { useAddressStore, type Address } from '@mymeddevices/shared-core';
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

    const isDefault = addresses.some((a) => a.id === addressToDelete.id && a.isDefault);

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
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Banner */}
      <Card className="border border-border/80 shadow-xs overflow-hidden rounded-2xl bg-card">
        <div className="p-6 md:p-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
                <MapPin className="h-3.5 w-3.5" />
                <span>Delivery & Dispatch Management</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Shipping Addresses
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Manage your hospital, clinic, practice, and residential delivery destinations for rapid checkout and courier tracking.
              </p>
            </div>

            <Button
              onClick={() => {
                setEditingAddress(undefined);
                setAddSheetOpen(true);
              }}
              className="gap-2 rounded-xl font-semibold shrink-0 shadow-xs self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Address</span>
            </Button>
          </div>

          {/* Quick Summary Chips */}
          <div className="mt-5 pt-4 border-t border-border/50 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-background text-foreground shadow-2xs">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Saved Locations:</span>
              <span className="font-bold">{hydrated ? addresses.length : '...'}</span>
            </div>

            {defaultAddress && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-2xs max-w-sm truncate">
                <Truck className="h-3.5 w-3.5 shrink-0" />
                <span className="text-muted-foreground">Default:</span>
                <span className="font-bold truncate">{defaultAddress.address}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Main Address List in 2 columns */}
      {!hydrated ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      ) : !hasAddresses ? (
        <AddressesEmptyState
          onAdd={() => {
            setEditingAddress(undefined);
            setAddSheetOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              isDefaultShipping={address.isDefault}
              isDefaultBilling={address.isDefault}
              onSetDefaultShipping={() => handleSetDefault(address.id)}
              onEdit={() => handleEditAddress(address)}
              onDelete={() => handleDeleteClick(address)}
            />
          ))}
        </div>
      )}

      {/* 3. Delivery Assurance Information Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-foreground text-sm">Cold-Chain & Sensitive Equipment Dispatch</h4>
          <p className="text-muted-foreground leading-relaxed">
            All medical deliveries include temperature-monitored courier handling and direct doorstep delivery across all 47 counties in Kenya. Our couriers follow strict GDP (Good Distribution Practice) guidelines.
          </p>
        </div>
      </div>

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
