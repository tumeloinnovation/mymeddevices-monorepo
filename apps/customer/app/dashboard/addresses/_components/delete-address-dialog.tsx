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
import { Loader2, Trash2, AlertTriangle, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Address } from '@/lib/store/useAddressStore';

interface DeleteAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  address: Address | null;
  isLoading?: boolean;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

/**
 * Confirmation dialog for deleting addresses
 */
export function DeleteAddressDialog({
  open,
  onOpenChange,
  onConfirm,
  address,
  isLoading = false,
  isDefaultShipping = false,
  isDefaultBilling = false,
}: DeleteAddressDialogProps) {
  if (!address) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            Are you sure you want to delete this address?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Address Preview */}
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg my-4">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{address.address}</p>
            {address.region && (
              <p className="text-xs text-muted-foreground mt-1">{address.region}</p>
            )}
          </div>
        </div>

        {/* Warning if default address */}
        {(isDefaultShipping || isDefaultBilling) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                This is your default address
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                {isDefaultShipping && isDefaultBilling
                  ? 'It is set as both your default shipping and billing address.'
                  : isDefaultShipping
                  ? 'It is set as your default shipping address.'
                  : 'It is set as your default billing address.'}
                {' '}You'll need to set another address as default before deleting this one.
              </p>
            </div>
          </motion.div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading || (isDefaultShipping && isDefaultBilling)}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Address
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
