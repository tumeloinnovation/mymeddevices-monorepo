'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import AddressAutocomplete from '@/components/maps/AddressAutocomplete';
import type { VendorStoreAddress } from '@/lib/data/types';

interface AddressSectionProps {
    address: VendorStoreAddress;
    location: string;
    onChange: (address: VendorStoreAddress, location?: string) => void;
}

export function AddressSection({ address, location, onChange }: AddressSectionProps) {
    const [localAddress, setLocalAddress] = useState<VendorStoreAddress>(address);

    const handleFieldChange = (field: keyof VendorStoreAddress, value: string) => {
        const updated = { ...localAddress, [field]: value };
        setLocalAddress(updated);
        onChange(updated);
    };

    const handlePlaceSelected = (place: {
        place_id: string;
        formatted_address?: string;
        lat: number;
        lng: number;
        city?: string;
        country?: string;
        postcode?: string;
        address_1?: string;
        address_2?: string;
        region?: string;
    }) => {
        const updated: VendorStoreAddress = {
            street_1: place.address_1 || '',
            street_2: place.address_2 || '',
            city: place.city || '',
            zip: place.postcode || '',
            country: place.country || '',
            state: place.region || '',
        };
        setLocalAddress(updated);
        onChange(updated, `${place.lat},${place.lng}`);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Store Address
                </CardTitle>
                <CardDescription>
                    Your store&apos;s physical location
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Google Places Autocomplete */}
                <div className="space-y-2">
                    <Label>Search Address</Label>
                    <AddressAutocomplete
                        onPlaceSelected={handlePlaceSelected}
                        placeholder="Start typing to search..."
                        countryRestriction={['ke', 'ug', 'tz']} // East Africa
                    />
                    <p className="text-xs text-muted-foreground">
                        Search for your address to auto-fill the fields below
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="street_1">Street Address</Label>
                        <Input
                            id="street_1"
                            value={localAddress.street_1}
                            onChange={(e) => handleFieldChange('street_1', e.target.value)}
                            placeholder="123 Main Street"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="street_2">Street Address 2</Label>
                        <Input
                            id="street_2"
                            value={localAddress.street_2}
                            onChange={(e) => handleFieldChange('street_2', e.target.value)}
                            placeholder="Suite, Unit, Building, etc."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                            id="city"
                            value={localAddress.city}
                            onChange={(e) => handleFieldChange('city', e.target.value)}
                            placeholder="Nairobi"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="state">State / Region</Label>
                        <Input
                            id="state"
                            value={localAddress.state}
                            onChange={(e) => handleFieldChange('state', e.target.value)}
                            placeholder="Nairobi County"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="zip">Postal Code</Label>
                        <Input
                            id="zip"
                            value={localAddress.zip}
                            onChange={(e) => handleFieldChange('zip', e.target.value)}
                            placeholder="00100"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                            id="country"
                            value={localAddress.country}
                            onChange={(e) => handleFieldChange('country', e.target.value)}
                            placeholder="Kenya"
                        />
                    </div>
                </div>

                {location && (
                    <p className="text-xs text-muted-foreground">
                        Coordinates: {location}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
