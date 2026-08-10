'use client';

/**
 * VendorAddressAutocomplete - Google Places autocomplete for vendor registration
 * Simplified version for address selection in vendor profile
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Loader2, MapPin } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useGoogleMaps } from '../../maps/useGoogleMaps';

interface PlaceResult {
  place_id: string;
  formatted_address?: string;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  country?: string;
  region?: string;
}

interface VendorAddressAutocompleteProps {
  onPlaceSelected: (place: PlaceResult) => void;
  disabled?: boolean;
  className?: string;
  countryRestriction?: string | string[];
  showManualFallback?: boolean; // Show manual input when Google Maps fails
}

interface Suggestion {
  placePrediction: {
    placeId: string;
    text: { text: string };
    structuredFormat: {
      mainText: { text: string };
      secondaryText: { text: string };
    };
  };
}

export function VendorAddressAutocomplete({
  onPlaceSelected,
  disabled = false,
  className = '',
  countryRestriction = 'ke',
  showManualFallback = true,
}: VendorAddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [useManualMode, setUseManualMode] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Use Google Maps hook to load the API
  const { ready: isApiLoaded, error: mapsError } = useGoogleMaps(undefined, { libraries: ['places'] });

  // Switch to manual mode if there's an error with Google Maps
  useEffect(() => {
    if (mapsError && showManualFallback) {
      setUseManualMode(true);
    }
  }, [mapsError, showManualFallback]);

  // Initialize session token when API is ready
  useEffect(() => {
    if (isApiLoaded && typeof google !== 'undefined' && google.maps?.places) {
      try {
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      } catch (err) {
        console.warn('[VendorAddressAutocomplete] Could not create session token:', err);
      }
    }
  }, [isApiLoaded]);

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim() || disabled || !isApiLoaded) {
        setSuggestions([]);
        return;
      }

      setLoading(true);

      try {
        const { AutocompleteSuggestion } = google.maps.places as any;

        if (!AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
          console.warn('[VendorAddressAutocomplete] Autocomplete API not available');
          setLoading(false);
          return;
        }

        const request: any = {
          input: query,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: countryRestriction
            ? Array.isArray(countryRestriction)
              ? countryRestriction
              : [countryRestriction]
            : undefined,
        };

        const { suggestions: fetchedSuggestions } =
          await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

        setSuggestions(fetchedSuggestions || []);
        setShowDropdown(true);
      } catch (err: any) {
        console.error('[VendorAddressAutocomplete] Error fetching suggestions:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [disabled, countryRestriction, isApiLoaded]
  );

  // Debounced input handler
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (inputValue.trim()) {
        fetchSuggestions(inputValue);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue, fetchSuggestions]);

  // Fetch place details when a suggestion is selected
  const selectPlace = useCallback(
    async (placeId: string, displayText: string) => {
      if (!google?.maps?.places) return;

      setShowDropdown(false);
      setInputValue(displayText);
      setLoading(true);

      try {
        const { Place } = google.maps.places as any;

        if (!Place) {
          console.error('[VendorAddressAutocomplete] Place not available');
          setLoading(false);
          return;
        }

        const place = new Place({ id: placeId });

        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
        });

        let address = '';
        let city = '';
        let country = '';
        let region = '';

        if (place.addressComponents) {
          for (const component of place.addressComponents) {
            const types = component.types;
            if (types.includes('locality') || types.includes('postal_town')) {
              city = component.longText;
            }
            if (types.includes('country')) {
              country = component.longText;
            }
            if (types.includes('administrative_area_level_1')) {
              region = component.longText;
            }
          }
        }

        address = place.formattedAddress || displayText;

        const result: PlaceResult = {
          place_id: placeId,
          formatted_address: place.formattedAddress,
          lat: place.location.lat(),
          lng: place.location.lng(),
          address,
          city,
          country,
          region,
        };

        onPlaceSelected(result);

        // Create new session token
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      } catch (err) {
        console.error('[VendorAddressAutocomplete] Error fetching place details:', err);
      } finally {
        setLoading(false);
      }
    },
    [onPlaceSelected]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          const suggestion = suggestions[selectedIndex];
          selectPlace(
            suggestion.placePrediction.placeId,
            suggestion.placePrediction.text.text
          );
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isApiLoaded && !useManualMode) {
    return (
      <div className={cn('space-y-2', className)}>
        <Label htmlFor="vendor-address">Business Address *</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            id="vendor-address"
            placeholder={mapsError ? 'Address search unavailable' : 'Loading address search...'}
            disabled
            className="pl-10"
          />
        </div>
        <p className={cn('text-xs', mapsError ? 'text-destructive' : 'text-muted-foreground')}>
          {mapsError ? 'Address search is currently unavailable. Please try again later.' : 'Google Maps is loading. Please wait...'}
        </p>
        {mapsError && showManualFallback && (
          <button
            type="button"
            onClick={() => setUseManualMode(true)}
            className="text-xs text-orange-600 hover:underline"
          >
            Enter address manually instead
          </button>
        )}
      </div>
    );
  }

  // Manual entry mode
  if (useManualMode) {
    const handleManualSubmit = () => {
      if (!inputValue || !manualLat || !manualLng) {
        return; // Validation will be handled by parent
      }
      onPlaceSelected({
        place_id: 'manual',
        address: inputValue,
        formatted_address: inputValue,
        lat: parseFloat(manualLat),
        lng: parseFloat(manualLng),
      });
    };

    return (
      <div className={cn('space-y-3', className)}>
        <Label htmlFor="vendor-address">Business Address *</Label>
        <div className="space-y-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              id="vendor-address"
              placeholder="Enter your business address"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={disabled}
              className="pl-10"
              autoComplete="street-address"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Latitude"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              disabled={disabled}
              autoComplete="off"
            />
            <Input
              placeholder="Longitude"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              disabled={disabled}
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            onClick={handleManualSubmit}
            disabled={!inputValue || !manualLat || !manualLng || disabled}
            className="w-full h-10 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
          >
            Use This Address
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter your business address and coordinates manually.
        </p>
        {showManualFallback && !mapsError && (
          <button
            type="button"
            onClick={() => setUseManualMode(false)}
            className="text-xs text-orange-600 hover:underline"
          >
            Use address search instead
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="vendor-address">Business Address *</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          id="vendor-address"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder="Search for your business address..."
          disabled={disabled}
          className="pl-10 pr-10"
          autoComplete="street-address"
          aria-autocomplete="list"
          aria-controls="vendor-address-suggestions"
          aria-expanded={showDropdown}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {showDropdown && Array.isArray(suggestions) && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          id="vendor-address-suggestions"
          role="listbox"
          className="absolute z-50 w-full rounded-md border bg-popover shadow-lg max-h-[300px] overflow-y-auto"
        >
          <div className="p-1">
            {suggestions.map((suggestion, index) => {
              const { placeId, structuredFormat, text } = suggestion.placePrediction;

              const mainText = structuredFormat?.mainText?.text || text?.text || '';
              const secondaryText = structuredFormat?.secondaryText?.text || '';

              return (
                <button
                  key={placeId}
                  type="button"
                  role="option"
                  aria-selected={index === selectedIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectPlace(placeId, suggestion.placePrediction.text.text);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm',
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  )}
                >
                  <div className="font-medium">{mainText}</div>
                  {secondaryText && (
                    <div className="text-xs text-muted-foreground">{secondaryText}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Start typing your business address and select from the suggestions.
      </p>
    </div>
  );
}
