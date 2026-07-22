'use client';

import { Button } from '@/components/ui/button';
import { LucideIcon } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// ============================================================================
// EMPTY STATE TYPES
// ============================================================================

interface BaseEmptyStateProps {
  illustration?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  className?: string;
}

interface IconEmptyStateProps extends Omit<BaseEmptyStateProps, 'illustration'> {
  icon: LucideIcon;
  iconClassName?: string;
}

// ============================================================================
// BASE EMPTY STATE
// ============================================================================

/**
 * Base empty state component with custom illustration
 * Use when you have a custom illustration or no illustration needed
 */
export function EmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: BaseEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}
    >
      {illustration && (
        <div className="mb-6 text-muted-foreground/50">
          {illustration}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

// ============================================================================
// ICON-BASED EMPTY STATES
// ============================================================================

/**
 * Empty state with icon instead of custom illustration
 * Common for lists, tables, and collections
 */
export function IconEmptyState({
  icon: Icon,
  iconClassName,
  title,
  description,
  action,
  className,
}: IconEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}
    >
      <div className={cn('mb-6 text-muted-foreground/50', iconClassName)}>
        <Icon className="h-16 w-16" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

// ============================================================================
// SPECIALIZED EMPTY STATES
// ============================================================================

import {
  Package,
  Heart,
  MapPin,
  CreditCard,
  FileText,
  Search,
  ShoppingCart,
  Inbox,
} from 'lucide-react';

/**
 * Orders empty state
 */
export function OrdersEmptyState({
  onShop,
}: {
  onShop?: () => void;
}) {
  return (
    <IconEmptyState
      icon={Package}
      title="No orders yet"
      description="You haven't placed any orders. Start shopping to see your orders here."
      action={onShop ? { label: 'Start Shopping', onClick: onShop } : undefined}
    />
  );
}

/**
 * Wishlist empty state
 */
export function WishlistEmptyState({
  onBrowse,
}: {
  onBrowse?: () => void;
}) {
  return (
    <IconEmptyState
      icon={Heart}
      title="Your wishlist is empty"
      description="Save items you love by clicking the heart icon on any product."
      action={onBrowse ? { label: 'Browse Products', onClick: onBrowse } : undefined}
    />
  );
}

/**
 * Addresses empty state
 */
export function AddressesEmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <IconEmptyState
      icon={MapPin}
      title="No addresses saved"
      description="Add a delivery address for faster checkout and accurate delivery."
      action={{ label: 'Add Address', onClick: onAdd }}
    />
  );
}

/**
 * Payment methods empty state
 */
export function PaymentMethodsEmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <IconEmptyState
      icon={CreditCard}
      title="No payment methods saved"
      description="Add a payment method for faster checkout. We support M-Pesa and major cards."
      action={{ label: 'Add Payment Method', onClick: onAdd }}
    />
  );
}

/**
 * Prescriptions empty state
 */
export function PrescriptionsEmptyState({
  onUpload,
}: {
  onUpload?: () => void;
}) {
  return (
    <IconEmptyState
      icon={FileText}
      title="No prescriptions on file"
      description="Upload your prescriptions to easily order medical devices that require them."
      action={onUpload ? { label: 'Upload Prescription', onClick: onUpload } : undefined}
    />
  );
}

/**
 * Search results empty state
 */
export function SearchEmptyState({
  query,
  onClear,
}: {
  query: string;
  onClear?: () => void;
}) {
  return (
    <IconEmptyState
      icon={Search}
      title={`No results for "${query}"`}
      description="Try adjusting your search or filters to find what you're looking for."
      action={onClear ? { label: 'Clear Search', onClick: onClear, variant: 'outline' as const } : undefined}
    />
  );
}

/**
 * Cart empty state
 */
export function CartEmptyState({
  onShop,
}: {
  onShop?: () => void;
}) {
  return (
    <IconEmptyState
      icon={ShoppingCart}
      title="Your cart is empty"
      description="Add items to your cart to see them here."
      action={onShop ? { label: 'Start Shopping', onClick: onShop } : undefined}
    />
  );
}

/**
 * Generic inbox/messages empty state
 */
export function InboxEmptyState({
  action,
}: {
  action?: { label: string; onClick: () => void };
}) {
  return (
    <IconEmptyState
      icon={Inbox}
      title="No messages yet"
      description="When you have messages, they'll appear here."
      action={action}
    />
  );
}

/**
 * Compact empty state for smaller spaces
 */
export function CompactEmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <p className="text-sm text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
