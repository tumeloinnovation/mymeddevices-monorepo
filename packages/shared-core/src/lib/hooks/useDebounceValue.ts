'use client'

// lib/hooks/useDebounceValue.ts
"use client";
import { useEffect, useState } from "react";

/** Delay updating a value until after `delay` ms of inactivity. */
export function useDebounceValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
