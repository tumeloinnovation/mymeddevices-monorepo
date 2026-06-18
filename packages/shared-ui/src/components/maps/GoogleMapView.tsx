"use client";

/**
 * GoogleMapView - Interactive map with marker and click-to-geocode
 *
 * Features:
 * - Only initializes when rendered (lazy loading)
 * - Updates marker when selectedPosition changes
 * - Supports map click → reverse geocode
 * - Exposes panTo and getMap methods via ref
 * - Shows loading state during initialization
 */

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Loader2 } from "lucide-react";

interface GoogleMapViewProps {
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  selectedPosition?: { lat: number; lng: number } | null;
  onMapClick?: (lat: number, lng: number, address?: string) => void;
  onLoad?: (map: google.maps.Map) => void;
  className?: string;
}

export interface GoogleMapViewRef {
  panTo: (lat: number, lng: number, zoom?: number) => void;
  getMap: () => google.maps.Map | null;
}

const GoogleMapView = forwardRef<GoogleMapViewRef, GoogleMapViewProps>(
  (
    {
      initialCenter = { lat: 0, lng: 0 },
      initialZoom = 12,
      selectedPosition,
      onMapClick,
      onLoad,
      className = "",
    },
    ref
  ) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    // Helper functions for marker compatibility
    const updateMarkerPosition = (
      marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker,
      position: { lat: number; lng: number }
    ) => {
      if (marker instanceof google.maps.marker.AdvancedMarkerElement) {
        marker.position = position;
      } else {
        marker.setPosition(position);
      }
    };

    const setMarkerMap = (
      marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker,
      map: google.maps.Map | null
    ) => {
      if (marker instanceof google.maps.marker.AdvancedMarkerElement) {
        marker.map = map;
      } else {
        marker.setMap(map);
      }
    };    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      panTo: (lat: number, lng: number, zoom?: number) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat, lng });
          if (zoom !== undefined) {
            mapInstanceRef.current.setZoom(zoom);
          }
        }
      },
      getMap: () => mapInstanceRef.current,
    }));

    // Initialize map
    useEffect(() => {
      if (!mapContainerRef.current) return;

      if (typeof google === "undefined" || !google.maps) {
        setError("Google Maps not loaded");
        setLoading(false);
        return;
      }


      try {
        // Create map instance
        const map = new google.maps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: "greedy",
        });

        mapInstanceRef.current = map;

        // Initialize geocoder for reverse geocoding
        geocoderRef.current = new google.maps.Geocoder();

        // Create marker (initially hidden)
        let marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker;

        // Try to use AdvancedMarkerElement first, fall back to regular Marker
        if (google.maps.marker?.AdvancedMarkerElement) {
          marker = new google.maps.marker.AdvancedMarkerElement({
            map: map,
            position: null, // Will be set when position is provided
            gmpDraggable: false,
          });
        } else {
          console.warn("[GoogleMapView] AdvancedMarkerElement not available, falling back to Marker");
          marker = new google.maps.Marker({
            map: map,
            position: null,
            visible: false,
            animation: google.maps.Animation.DROP,
          });
        }

        markerRef.current = marker;        // Handle map clicks
        map.addListener("click", async (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;

          const lat = e.latLng.lat();
          const lng = e.latLng.lng();


          // Update marker position
          updateMarkerPosition(marker, { lat, lng });
          setMarkerMap(marker, map);

          // Reverse geocode to get address
          if (geocoderRef.current) {
            try {
              const response = await geocoderRef.current.geocode({
                location: { lat, lng },
              });

              if (response.results && response.results.length > 0) {
                const address = response.results[0].formatted_address;
                onMapClick?.(lat, lng, address);
              } else {
                console.warn("[GoogleMapView] No results from reverse geocode");
                onMapClick?.(lat, lng);
              }
            } catch (err) {
              console.error("[GoogleMapView] Reverse geocode error:", err);
              onMapClick?.(lat, lng);
            }
          } else {
            onMapClick?.(lat, lng);
          }
        });

        setLoading(false);
        onLoad?.(map);
      } catch (err: any) {
        console.error("[GoogleMapView] Failed to initialize map:", err);
        setError(err.message || "Failed to initialize map");
        setLoading(false);
      }
    }, [initialCenter, initialZoom, onMapClick, onLoad]);

    // Update marker when selectedPosition changes
    useEffect(() => {
      if (!mapInstanceRef.current || !markerRef.current) return;

      if (selectedPosition) {
        updateMarkerPosition(markerRef.current, selectedPosition);
        setMarkerMap(markerRef.current, mapInstanceRef.current);

        // Pan to the new position
        mapInstanceRef.current.panTo(selectedPosition);
      } else {
        setMarkerMap(markerRef.current, null); // Hide marker by removing from map
      }
    }, [selectedPosition]);

    // Handle container resize
    useEffect(() => {
      if (!mapInstanceRef.current) return;

      const handleResize = () => {
        if (mapInstanceRef.current) {
          google.maps.event.trigger(mapInstanceRef.current, "resize");
        }
      };

      const resizeObserver = new ResizeObserver(handleResize);
      if (mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    return (
      <div className={`relative ${className}`}>
        <div
          ref={mapContainerRef}
          className="w-full h-full min-h-[400px] rounded-md"
          style={{ background: "#e5e3df" }}
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 rounded-md">
            <div className="text-center p-4">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Please check your Google Maps configuration
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

GoogleMapView.displayName = "GoogleMapView";

export default GoogleMapView;
