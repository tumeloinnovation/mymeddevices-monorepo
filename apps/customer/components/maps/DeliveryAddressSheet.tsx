"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Search,
  Loader2,
  AlertCircle,
  Home,
  Briefcase,
  Plus,
  Check,
  Navigation,
} from "lucide-react";

import { useGoogleMaps } from "./useGoogleMaps";
import AddressAutocomplete from "./AddressAutocomplete";
import { useAddressStore, PREDEFINED_TAGS, type AddressTag } from "@/lib/store/useAddressStore";

interface Address {
  id?: string;
  address: string;
  lat: number;
  lon: number;
  tag?: AddressTag;
  city?: string;
  state?: string;
  postcode?: string;
  region?: string;
  country?: string;
  address_2?: string;
}

interface DeliveryAddressSheetProps {
  delivery?: Address | null;
  onSelect: (address: Address) => void;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TAG_ICONS: Record<string, React.ComponentType<any>> = {
  home: Home,
  work: Briefcase,
  office: Briefcase,
};

export default function DeliveryAddressSheet({
  delivery,
  onSelect,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: DeliveryAddressSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(delivery || null);
  const [selectedTag, setSelectedTag] = useState<AddressTag | "">("");
  const [customTagInput, setCustomTagInput] = useState("");
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);

  const {
    addAddress,
    customTags,
    addCustomTag,
  } = useAddressStore();

  const { ready: mapsReady, error: mapsError } = useGoogleMaps();

  const handlePlaceSelected = (place: any) => {
    const address: Address = {
      address: place.address_1 || place.formatted_address || place.name || "Unknown location",
      lat: place.lat,
      lon: place.lng,
      region: place.region || "Kenya",
      city: place.city,
      country: place.country,
      postcode: place.postcode,
      address_2: place.address_2,
    };

    setSelectedAddress(address);
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim()) {
      addCustomTag(customTagInput.trim());
      setSelectedTag(customTagInput.trim().toLowerCase());
      setCustomTagInput("");
      setShowCustomTagInput(false);
    }
  };

  const handleConfirm = () => {
    if (selectedAddress) {
      addAddress({
        address: selectedAddress.address,
        lat: selectedAddress.lat.toString(),
        lon: selectedAddress.lon.toString(),
        region: selectedAddress.region || "Kenya",
        city: selectedAddress.city,
        country: selectedAddress.country,
        postcode: selectedAddress.postcode,
        address_2: selectedAddress.address_2,
        tag: selectedTag || undefined,
      });

      onSelect(selectedAddress);
      setOpen(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSelectedAddress(delivery || null);
      setSelectedTag("");
    }
  }, [open, delivery]);

  const allTags = [...PREDEFINED_TAGS, ...customTags];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}

      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-card border-l border-border">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border space-y-1">
          <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
            {delivery ? 'Edit Address' : 'Add Delivery Address'}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Search location via Google Maps and assign a label.
          </SheetDescription>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error state */}
          {mapsError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-0.5">
                <p className="text-xs font-semibold">Google Maps Error</p>
                <p className="text-[11px] opacity-90">{mapsError.message}</p>
              </div>
            </div>
          )}

          {/* Search Section */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-primary" />
                Google Maps Search
              </span>
              <span className="text-[10px] text-muted-foreground">Kenya Locations Only</span>
            </Label>
            <AddressAutocomplete
              onPlaceSelected={handlePlaceSelected}
              placeholder="Type building, street, or town..."
              disabled={!mapsReady}
              countryRestriction="ke"
            />
            {!mapsReady && !mapsError && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Initializing Google Maps API...</span>
              </div>
            )}
          </div>

          {/* Selected Address Preview */}
          {selectedAddress && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">Target Location</span>
                  <p className="text-xs font-semibold text-foreground leading-snug">{selectedAddress.address}</p>
                  {selectedAddress.region && (
                    <p className="text-[11px] text-muted-foreground">{selectedAddress.region}</p>
                  )}
                </div>
              </div>

              {/* Tag Assignment */}
              <div className="pt-3 border-t border-primary/10 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground block">Address Label / Tag</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedTag}
                    onValueChange={(val) => {
                      if (val === "custom") {
                        setShowCustomTagInput(true);
                      } else {
                        setSelectedTag(val as AddressTag);
                        setShowCustomTagInput(false);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Assign label (e.g. Home, Work)" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTags.map((tag) => (
                        <SelectItem key={tag} value={tag} className="capitalize text-xs">
                          {tag}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" className="text-xs">
                        <span className="flex items-center gap-1.5">
                          <Plus className="h-3 w-3" />
                          Create custom label
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showCustomTagInput && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="e.g. Clinic Warehouse"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                      className="h-8 text-xs"
                    />
                    <Button size="sm" onClick={handleAddCustomTag} className="h-8 text-xs px-3">
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-muted/20 mt-auto space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 h-9 text-xs">
              Cancel
            </Button>

            <Button
              onClick={handleConfirm}
              disabled={!selectedAddress}
              className="flex-1 h-9 text-xs font-medium gap-2"
            >
              <Check className="h-3.5 w-3.5" />
              Save Location
            </Button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center">
            <Navigation className="h-3 w-3 text-primary shrink-0" />
            <span>Precise latitude & longitude coordinates saved</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
