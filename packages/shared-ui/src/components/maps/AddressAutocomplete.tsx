"use client";

/**
 * AddressAutocomplete - Uses Google Places API (New) for address suggestions
 *
 * Strategy:
 * 1. Prefer the new PlaceAutocompleteElement web component if available
 * 2. Fallback to custom implementation using google.maps.places.AutocompleteSuggestion
 * 3. Uses session tokens to group queries (cost optimization)
 * 4. Fetches place details with Place.fetchFields() for lat/lng
 *
 * Does NOT use legacy AutocompleteService or PlacesService
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface PlaceResult {
  place_id: string;
  formatted_address?: string;
  name?: string;
  lat: number;
  lng: number;
  region?: string; // Administrative area (county/region)
  city?: string;
  country?: string;
  postcode?: string;
  address_1?: string;
  address_2?: string;
  raw?: any;
}

interface AddressAutocompleteProps {
  onPlaceSelected: (place: PlaceResult) => void;
  placeholder?: string;
  disabled?: boolean;
  countryRestriction?: string | string[];
  className?: string;
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

export default function AddressAutocomplete({
  onPlaceSelected,
  placeholder = "Search for an address...",
  disabled = false,
  countryRestriction = "ke", // Default to Kenya
  className = "",
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize session token
  useEffect(() => {
    if (!disabled && typeof google !== "undefined" && google.maps?.places) {
      try {
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      } catch (err) {
        console.warn("[AddressAutocomplete] Could not create session token:", err);
      }
    }
  }, [disabled]);

  // Fetch autocomplete suggestions using new API
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim() || disabled) {
        setSuggestions([]);
        return;
      }

      // Check if new Places API is available
      if (typeof google === "undefined" || !google.maps?.places) {
        console.warn("[AddressAutocomplete] Google Maps Places API not loaded yet");
        return;
      }

      setLoading(true);

      try {
        // Use the new AutocompleteSuggestion.fetchAutocompleteSuggestions method
        // This is the 2025 recommended approach for Places API (New)
        const { AutocompleteSuggestion } = google.maps.places as any;

        if (!AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
          console.error(
            "[AddressAutocomplete] AutocompleteSuggestion.fetchAutocompleteSuggestions not available. " +
            "Ensure Places API (New) is enabled and you're using the latest Maps JS API."
          );
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


        const { suggestions: fetchedSuggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);


        setSuggestions(fetchedSuggestions || []);
        setShowDropdown(true);
      } catch (err: any) {
        console.error("[AddressAutocomplete] Error fetching suggestions:", err);

        // Handle specific error cases
        if (err.message?.includes("OVER_QUERY_LIMIT")) {
          console.error("[AddressAutocomplete] ⚠️ OVER_QUERY_LIMIT - Check your API quota and billing");
        } else if (err.message?.includes("REQUEST_DENIED")) {
          console.error(
            "[AddressAutocomplete] ⚠️ REQUEST_DENIED - Verify that Places API (New) is enabled in Google Cloud Console"
          );
        }

        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [disabled, countryRestriction]
  );

  // Debounced input handler
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 200);

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
          console.error("[AddressAutocomplete] google.maps.places.Place not available");
          setLoading(false);
          return;
        }

        // Create a Place instance and fetch fields
        const place = new Place({
          id: placeId,
        });

        await place.fetchFields({
          fields: ["displayName", "formattedAddress", "location", "addressComponents"],
        });

        // Extract address components
        let region = "";
        let city = "";
        let country = "";
        let postcode = "";
        let streetNumber = "";
        let route = "";
        let subpremise = "";

        if (place.addressComponents) {
          for (const component of place.addressComponents) {
            const types = component.types;
            if (types.includes("administrative_area_level_1")) {
              region = component.longText;
            }
            if (types.includes("locality") || types.includes("postal_town")) {
              city = component.longText;
            }
            if (types.includes("country")) {
              country = component.longText; // or shortText for code
            }
            if (types.includes("postal_code")) {
              postcode = component.longText;
            }
            if (types.includes("street_number")) {
              streetNumber = component.longText;
            }
            if (types.includes("route")) {
              route = component.longText;
            }
            if (types.includes("subpremise")) {
              subpremise = component.longText;
            }
          }

          // Fallback for city if locality is missing (common in some areas)
          if (!city) {
            const adminArea2 = place.addressComponents.find((c: any) => c.types.includes("administrative_area_level_2"));
            if (adminArea2) city = adminArea2.longText;
          }

          console.debug("[AddressAutocomplete] Extracted components:", { region, city, country, postcode, streetNumber, route });
        }

        const address1 = streetNumber && route ? `${streetNumber} ${route}` : route || place.formattedAddress?.split(',')[0] || place.displayName;

        const result: PlaceResult = {
          place_id: placeId,
          formatted_address: place.formattedAddress,
          name: place.displayName,
          lat: place.location.lat(),
          lng: place.location.lng(),
          region: region || "Kenya",
          city: city,
          country: country,
          postcode: postcode,
          address_1: address1,
          address_2: subpremise,
          raw: place,
        };

        onPlaceSelected(result);

        // Create new session token for next search
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        console.debug("[AddressAutocomplete] New session token created");
      } catch (err) {
        console.error("[AddressAutocomplete] Error fetching place details:", err);
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
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          const suggestion = suggestions[selectedIndex];
          selectPlace(
            suggestion.placePrediction.placeId,
            suggestion.placePrediction.text.text
          );
        }
        break;
      case "Escape":
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Label htmlFor="address-autocomplete" className="sr-only">
        Address Search
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-autocomplete"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
          aria-autocomplete="list"
          aria-controls="address-suggestions"
          aria-expanded={showDropdown}
          aria-activedescendant={
            selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
          }
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
          id="address-suggestions"
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg"
        >
          <div className="max-h-[300px] overflow-y-auto p-1">
            {suggestions.map((suggestion, index) => {
              const { placeId, structuredFormat, text } = suggestion.placePrediction;

              // Safely get text values with fallbacks
              const mainText = structuredFormat?.mainText?.text || text?.text || "Unknown location";
              const secondaryText = structuredFormat?.secondaryText?.text || "";

              return (
                <button
                  key={placeId}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  onClick={() => selectPlace(placeId, suggestion.placePrediction.text.text)}
                  className={`w-full text-left px-3 py-2 rounded-sm cursor-pointer transition-colors ${index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                    }`}
                >
                  <div className="font-medium text-sm">
                    {mainText}
                  </div>
                  {secondaryText && (
                    <div className="text-xs text-muted-foreground">
                      {secondaryText}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
