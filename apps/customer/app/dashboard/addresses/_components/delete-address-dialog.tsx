'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, AlertTriangle, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Address } from '@mymeddevices/shared-core';

interface DeleteAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  address: Address | null;
  isLoading?: boolean;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

export function DeleteAddressDialog({
  open,
  onOpenChange,
  onConfirm,
  address,
  isLoading = false,
  isDefaultShipping = false,
}: DeleteAddressDialogProps) {
  if (!address) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-md border border-border bg-card">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/15 text-destructive border border-destructive/20 shrink-0">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-bold text-foreground">
                Delete Address
              </AlertDialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                This will remove the delivery location from your account.
              </p>
            </div>
          </div>
        </AlertDialogHeader>

        {/* Address Preview */}
        <div className="flex items-start gap-3 p-3.5 bg-muted/40 border border-border/70 rounded-xl my-2">
          <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{address.address}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {[address.address_2, address.city, address.region, address.country || 'Kenya']
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
        </div>

        {/* Warning if default address */}
        {isDefaultShipping && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-900 dark:text-amber-200"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 text-xs">
              <p className="font-bold">Cannot delete default address</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Please designate another address as your default shipping address before deleting this location.
              </p>
            </div>
          </motion.div>
        )}

        <AlertDialogFooter className="gap-2 sm:gap-0 pt-2">
          <AlertDialogCancel disabled={isLoading} className="rounded-xl text-xs font-semibold">
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading || isDefaultShipping}
            className="rounded-xl text-xs font-semibold gap-2 shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete Address</span>
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
