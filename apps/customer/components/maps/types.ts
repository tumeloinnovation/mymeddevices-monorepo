/**
 * Type definitions for the Maps components
 */

export interface Address {
  id?: string;
  address: string;
  lat: number;
  lon: number;
  tag?: "Home" | "Work" | "Other" | string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface PlaceResult {
  place_id: string;
  formatted_address?: string;
  name?: string;
  lat: number;
  lng: number;
  raw?: any;
}

export interface MapPosition {
  lat: number;
  lng: number;
}

export interface GoogleMapsConfig {
  apiKey: string;
  libraries?: string[];
  version?: string;
}
