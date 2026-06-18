/**
 * Hook to load Google Maps JavaScript API with Places library
 * Uses @googlemaps/js-api-loader v2 functional API
 * Only loads once per page session
 */

import { useEffect, useState, useMemo } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

interface UseGoogleMapsOptions {
  libraries?: string[];
}

interface UseGoogleMapsResult {
  ready: boolean;
  error?: Error;
}

// Singleton state to prevent multiple loads
let loadingPromise: Promise<void> | null = null;
let isLoaded = false;

export function useGoogleMaps(
  apiKey?: string,
  options: UseGoogleMapsOptions = {}
): UseGoogleMapsResult {
  const [ready, setReady] = useState(isLoaded);
  const [error, setError] = useState<Error>();

  const libraries = useMemo(() => options.libraries || ["places", "marker"], [options.libraries]);

  useEffect(() => {
    // If already loaded, mark ready immediately
    if (isLoaded) {
      setReady(true);
      return;
    }

    // If loading is in progress, wait for it
    if (loadingPromise) {
      loadingPromise
        .then(() => {
          isLoaded = true;
          setReady(true);
        })
        .catch((err) => {
          console.error("[useGoogleMaps] Failed to load Google Maps:", err);
          setError(err);
        });
      return;
    }

    // Get API key from env if not provided
    const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!key) {
      const err = new Error(
        "Google Maps API key not provided. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment."
      );
      console.error("[useGoogleMaps]", err.message);
      setError(err);
      return;
    }

    // Set options for the Maps JavaScript API
    setOptions({
      key: key,
      v: "weekly",
      libraries: libraries as any,
    });

    // Start loading all required libraries
    loadingPromise = (async () => {
      await Promise.all(
        libraries.map((lib) => importLibrary(lib as any))
      );
    })();

    loadingPromise
      .then(() => {
        isLoaded = true;
        setReady(true);
      })
      .catch((err) => {
        console.error("[useGoogleMaps] ❌ Failed to load Google Maps:", err);
        setError(err);
        loadingPromise = null; // Allow retry on next mount
      });
  }, [apiKey, libraries]);

  return { ready, error };
}
