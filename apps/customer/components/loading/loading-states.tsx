'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// PAGE SKELETONS
// ============================================================================

interface PageSkeletonProps {
  className?: string;
}

/**
 * Standard page loading skeleton
 * Use for initial page loads instead of spinner
 */
export function PageSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Content cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CARD SKELETONS
// ============================================================================

interface CardSkeletonProps {
  className?: string;
  header?: boolean;
  lines?: number;
}

/**
 * Card loading skeleton
 * Optional header, configurable number of lines
 */
export function CardSkeleton({ className, header = false, lines = 3 }: CardSkeletonProps) {
  return (
    <Card className={className}>
      {header && (
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
      )}
      <CardContent className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')} />
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// STAT CARD SKELETONS
// ============================================================================

/**
 * Stat card loading skeleton
 * Matches the layout of EnhancedStatCard
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TABLE SKELETONS
// ============================================================================

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * Table loading skeleton
 * Configurable rows and columns
 */
export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// LIST SKELETONS
// ============================================================================

interface ListSkeletonProps {
  items?: number;
  className?: string;
}

/**
 * List loading skeleton
 * For vertical lists of items
 */
export function ListSkeleton({ items = 3, className }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// INLINE LOADING STATES
// ============================================================================

interface InlineLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

/**
 * Inline loading spinner with optional text
 * Use for button actions, inline refreshes
 */
export function InlineLoader({ size = 'md', text, className }: InlineLoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// ============================================================================
// BUTTON LOADING STATE
// ============================================================================

interface ButtonLoadingProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Button wrapper that shows loading state
 * Replaces button content with spinner when loading
 */
export function ButtonLoading({ loading, children, className }: ButtonLoadingProps) {
  return (
    <button
      disabled={loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md',
        'bg-primary text-primary-foreground',
        'hover:bg-primary/90',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors',
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// ============================================================================
// PULSE LOADING (for live updates)
// ============================================================================

interface PulseLoaderProps {
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
}

/**
 * Subtle pulse animation for data being refreshed
 * Use for background/inline refreshes (not initial loads)
 */
export function PulseLoader({ loading, children, className }: PulseLoaderProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-muted/30 animate-pulse rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

// ============================================================================
// CENTERED SPINNER (fallback)
// ============================================================================

interface CenteredSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

/**
 * Centered loading spinner
 * Use as fallback for empty states or full-page loading
 */
export function CenteredSpinner({ size = 'md', text, className }: CenteredSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
      <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
