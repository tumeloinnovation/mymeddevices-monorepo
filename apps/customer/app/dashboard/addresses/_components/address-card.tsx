'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MapPin,
  CheckCircle2,
  Star,
  Trash2,
  Pencil,
  Home,
  Building2,
  Hospital,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Address } from '@mymeddevices/shared-core';
import { capitalizeTag } from '@mymeddevices/shared-core';

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
  work: Building2,
  office: Building2,
  hospital: Hospital,
  clinic: Hospital,
  pharmacy: Hospital,
};

export function AddressCard({
  address,
  isDefaultShipping = false,
  onSetDefaultShipping,
  onEdit,
  onDelete,
  isDeleting = false,
}: AddressCardProps) {
  const tagKey = address.tag ? address.tag.toLowerCase() : '';
  const TagIcon = TAG_ICONS[tagKey] || MapPin;

  return (
    <TooltipProvider>
      <Card
        className={cn(
          'border rounded-2xl bg-card shadow-xs transition-all hover:shadow-md relative overflow-hidden flex flex-col justify-between h-full',
          isDefaultShipping
            ? 'border-primary/50 bg-gradient-to-b from-primary/[0.04] via-card to-card ring-1 ring-primary/20'
            : 'border-border/80 hover:border-border'
        )}
      >
        {isDefaultShipping && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
        )}

        <CardContent className="p-5 flex flex-col justify-between flex-1 gap-4">
          {/* Card Top: Tag + Badges + Title */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'p-2.5 rounded-xl border shrink-0 transition-colors',
                    isDefaultShipping
                      ? 'bg-primary/15 border-primary/30 text-primary'
                      : 'bg-muted/60 border-border/70 text-muted-foreground'
                  )}
                >
                  <TagIcon className="h-4 w-4" />
                </div>
                {address.tag && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold py-0.5 px-2 bg-muted/40 capitalize border-border/80"
                  >
                    {capitalizeTag(address.tag)}
                  </Badge>
                )}
              </div>

              {isDefaultShipping && (
                <Badge
                  variant="secondary"
                  className="gap-1 text-[10px] font-bold px-2.5 py-0.5 bg-primary/15 text-primary border border-primary/25 shadow-2xs"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Default Address
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-sm sm:text-base text-foreground line-clamp-2">
                {address.address}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {[address.address_2, address.city, address.region, address.country || 'Kenya']
                  .filter(Boolean)
                  .join(', ')}
                {address.postcode && (
                  <span className="font-mono text-[11px] font-medium bg-muted/50 px-1.5 py-0.5 rounded ml-1.5 inline-block">
                    PO {address.postcode}
                  </span>
                )}
              </p>
            </div>

            {/* GPS Coordinates preview */}
            {address.lat && address.lon && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 pt-1">
                <Navigation className="h-3 w-3 text-primary shrink-0" />
                <span className="truncate">
                  GPS: {parseFloat(address.lat).toFixed(4)}°, {parseFloat(address.lon).toFixed(4)}°
                </span>
              </div>
            )}
          </div>

          {/* Card Footer Actions */}
          <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2 mt-auto">
            {!isDefaultShipping && onSetDefaultShipping ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onSetDefaultShipping}
                className="h-8 rounded-xl text-xs font-semibold gap-1.5 border-border hover:border-amber-400 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300"
              >
                <Star className="h-3.5 w-3.5 text-amber-500" />
                <span>Set as Default</span>
              </Button>
            ) : (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active Default
              </span>
            )}

            <div className="flex items-center gap-1">
              {onEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onEdit}
                      className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit Address</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Edit Location
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
                      className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Address</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {isDefaultShipping ? 'Default address cannot be deleted' : 'Delete Address'}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
