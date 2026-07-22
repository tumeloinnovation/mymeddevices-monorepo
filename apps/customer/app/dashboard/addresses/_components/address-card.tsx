'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { MapPin, Package, CreditCard, Home, Briefcase, MoreVertical, Trash2, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Address } from '@/lib/store/useAddressStore';

interface AddressCardProps {
  address: Address;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
  onSelect?: () => void;
  onSetDefaultShipping?: () => void;
  onSetDefaultBilling?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

const TAG_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  work: Briefcase,
  office: Briefcase,
};

/**
 * Card component for displaying addresses
 * Shows address details, tags, and default badges
 */
export function AddressCard({
  address,
  isDefaultShipping = false,
  isDefaultBilling = false,
  onSelect,
  onSetDefaultShipping,
  onSetDefaultBilling,
  onEdit,
  onDelete,
  isDeleting = false,
}: AddressCardProps) {
  const TagIcon = address.tag ? TAG_ICONS[address.tag] || MapPin : MapPin;

  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.95, height: 0 },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      layout
    >
      <Card
        className={cn(
          'relative transition-all duration-200 cursor-pointer hover:shadow-md',
          (isDefaultShipping || isDefaultBilling) && 'border-primary border-2'
        )}
        onClick={onSelect}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0',
                (isDefaultShipping || isDefaultBilling) && 'bg-primary/20'
              )}
            >
              <TagIcon className="h-5 w-5" />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  {/* Tags and Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {address.tag && (
                      <Badge variant="secondary" className="capitalize text-xs">
                        {address.tag}
                      </Badge>
                    )}
                    {isDefaultShipping && (
                      <Badge variant="default" className="gap-1 text-xs">
                        <Package className="h-3 w-3" />
                        Default Shipping
                      </Badge>
                    )}
                    {isDefaultBilling && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <CreditCard className="h-3 w-3" />
                        Default Billing
                      </Badge>
                )}
                  </div>

                  {/* Address */}
                  <p className="font-medium text-sm">{address.address}</p>

                  {/* Region */}
                  {address.region && (
                    <p className="text-xs text-muted-foreground">{address.region}</p>
                  )}

                  {/* Additional Details */}
                  {(address.city || address.postcode) && (
                    <p className="text-xs text-muted-foreground">
                      {[address.city, address.postcode].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    {!isDefaultShipping && onSetDefaultShipping && (
                      <DropdownMenuItem onClick={onSetDefaultShipping} className="gap-2">
                        <Package className="h-4 w-4" />
                        Set as Default Shipping
                      </DropdownMenuItem>
                    )}
                    {!isDefaultBilling && onSetDefaultBilling && (
                      <DropdownMenuItem onClick={onSetDefaultBilling} className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        Set as Default Billing
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={onEdit} className="gap-2">
                        <Check className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={onDelete}
                      disabled={isDeleting || (isDefaultShipping && isDefaultBilling)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * Add new address card (placeholder)
 */
export function AddAddressCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer group h-full"
        onClick={onClick}
      >
        <div className="flex items-center justify-center h-full min-h-[140px]">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <p className="font-medium text-sm">Add New Address</p>
            <p className="text-xs text-muted-foreground">Use Google Maps search</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
