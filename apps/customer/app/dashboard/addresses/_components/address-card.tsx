'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Package, Star, Trash2, Pencil, Home, Briefcase } from 'lucide-react';
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

export function AddressCard({
  address,
  isDefaultShipping = false,
  isDefaultBilling = false,
  onSetDefaultShipping,
  onEdit,
  onDelete,
  isDeleting = false,
}: AddressCardProps) {
  const TagIcon = address.tag ? TAG_ICONS[address.tag.toLowerCase()] || MapPin : MapPin;

  return (
    <TooltipProvider>
      <Card
        className={cn(
          'border border-border bg-card shadow-sm transition-all',
          isDefaultShipping && 'border-primary/50 bg-primary/[0.02]'
        )}
      >
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60 shrink-0">
              <TagIcon className="h-4 w-4 text-primary" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground truncate">
                  {address.address}
                </span>

                {address.tag && (
                  <Badge variant="outline" className="capitalize text-[10px] font-normal py-0">
                    {address.tag}
                  </Badge>
                )}

                {isDefaultShipping && (
                  <Badge variant="secondary" className="gap-1 text-[10px] font-medium px-2 py-0 bg-primary/10 text-primary border-primary/20">
                    <Package className="h-2.5 w-2.5" />
                    Default Shipping
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground truncate">
                {[address.region, address.city, address.postcode].filter(Boolean).join(', ') || 'Nairobi, Kenya'}
              </p>
            </div>
          </div>

          {/* Action Icon Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {!isDefaultShipping && onSetDefaultShipping && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSetDefaultShipping}
                    className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                  >
                    <Star className="h-4 w-4" />
                    <span className="sr-only">Set as Default</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Set as Default
                </TooltipContent>
              </Tooltip>
            )}

            {onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onEdit}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit Address</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Edit Address
                </TooltipContent>
              </Tooltip>
            )}

            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    disabled={isDeleting || isDefaultShipping}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Address</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {isDefaultShipping ? "Default address cannot be deleted" : "Delete Address"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
