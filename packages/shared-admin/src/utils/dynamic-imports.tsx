/**
 * Dynamic import utilities for route-based code splitting
 */

import { lazy, Suspense } from "react"
import { FullPageLoading } from "@mymeddevices/shared-core"

/**
 * Creates a lazy-loaded component with loading fallback
 * Use this for route components to enable code splitting
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn)

  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <FullPageLoading />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

/**
 * Preloads a component by importing it immediately
 * Useful for preloading components on hover or other user interactions
 */
export function preloadComponent(importFn: () => Promise<any>) {
  importFn()
}
