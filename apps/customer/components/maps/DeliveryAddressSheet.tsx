"use client";

/**
 * DeliveryAddressSheet - Simplified address selection UI
 *
 * Features:
 * - Search with autocomplete
 * - Saved addresses list with tags
 * - Set default shipping/billing
 */

import React, { useState, useEffect, ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Trash2,
  Home,
  Briefcase,
  Plus,
  Star,
  Truck,
  CreditCard,
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
}: DeliveryAddressSheetProps) {
  const [open, setOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(delivery || null);
  const [selectedTag, setSelectedTag] = useState<AddressTag | "">("");
  const [customTagInput, setCustomTagInput] = useState("");
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);

  // Use zustand address store
  const {
    addresses: savedAddresses,
    addAddress,
    removeAddress,
    updateAddress,
    customTags,
    addCustomTag,
    hydrated: addressesHydrated
  } = useAddressStore();

  // Load Google Maps when sheet opens
  const { ready: mapsReady, error: mapsError } = useGoogleMaps();

  // Handle place selection from autocomplete
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

  // Handle saved address selection
  const handleSavedAddressSelect = (addr: any) => {
    setSelectedAddress({
      id: addr.id,
      address: addr.address,
      lat: parseFloat(addr.lat || "0"),
      lon: parseFloat(addr.lon || "0"),
      region: addr.region,
      city: addr.city,
      country: addr.country,
      postcode: addr.postcode,
      address_2: addr.address_2,
      tag: addr.tag,
    });
  };

  // Handle adding custom tag
  const handleAddCustomTag = () => {
    if (customTagInput.trim()) {
      addCustomTag(customTagInput.trim());
      setSelectedTag(customTagInput.trim().toLowerCase());
      setCustomTagInput("");
      setShowCustomTagInput(false);
    }
  };

  // Confirm and close
  const handleConfirm = () => {
    if (selectedAddress) {
      // Save to zustand store with tag
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

  // Reset when opening
  useEffect(() => {
    if (open) {
      setSelectedAddress(delivery || null);
      setSelectedTag("");
    }
  }, [open, delivery]);

  const allTags = [...PREDEFINED_TAGS, ...customTags];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || <Button variant="outline">Select Address</Button>}
      </SheetTrigger>

      <SheetContent side="right" className="w-full p-6 sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Delivery Address
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Error state */}
          {mapsError && (
            <div className="flex items-start gap-2 p-4 rounded-md bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Failed to load Google Maps</p>
                <p className="text-xs">{mapsError.message}</p>
              </div>
            </div>
          )}

          {/* Search Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Address
            </Label>
            <AddressAutocomplete
              onPlaceSelected={handlePlaceSelected}
              placeholder="Start typing an address..."
              disabled={!mapsReady}
              countryRestriction="ke"
            />
            {!mapsReady && !mapsError && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading search...</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Saved Addresses Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Star className="h-4 w-4" />
              Saved Addresses ({addressesHydrated ? savedAddresses.length : 0})
            </Label>

            {savedAddresses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No saved addresses yet</p>
                <p className="text-xs">Search and save an address to see it here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {savedAddresses.map((addr) => {
                  const isSelected = selectedAddress?.address === addr.address;
                  const TagIcon = addr.tag ? TAG_ICONS[addr.tag] || MapPin : MapPin;

                  return (
                    <div
                      key={addr.id}
                      className={`group relative rounded-lg border p-3 transition-all cursor-pointer ${isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                        }`}
                      onClick={() => handleSavedAddressSelect(addr)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-md ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                          <TagIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {addr.tag && (
                              <Badge variant="secondary" className="text-xs capitalize">
                                {addr.tag}
                              </Badge>
                            )}
                            {addr.isDefault && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Truck className="h-3 w-3" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium line-clamp-2">{addr.address}</p>
                          {addr.region && (
                            <p className="text-xs text-muted-foreground mt-1">{addr.region}</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAddress(addr.id);
                            if (isSelected) setSelectedAddress(null);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-md"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected address & tag assignment */}
          {selectedAddress && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Selected Address</p>
                      <p className="text-sm text-muted-foreground mt-1">{selectedAddress.address}</p>
                    </div>
                  </div>
                </div>

                {/* Tag Selection */}
                <div className="space-y-2">
                  <Label>Add a tag (optional)</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedTag}
                      onValueChange={(val) => {
                        if (val === "custom") {
                          setShowCustomTagInput(true);
                        } else {
                          setSelectedTag(val);
                          setShowCustomTagInput(false);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a tag" />
                      </SelectTrigger>
                      <SelectContent>
                        {allTags.map((tag) => (
                          <SelectItem key={tag} value={tag} className="capitalize">
                            {tag}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">
                          <span className="flex items-center gap-2">
                            <Plus className="h-3 w-3" />
                            Add custom tag
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {showCustomTagInput && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Enter custom tag..."
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                      />
                      <Button size="sm" onClick={handleAddCustomTag}>
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedAddress}
              className="flex-1"
            >
              Confirm Address
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
