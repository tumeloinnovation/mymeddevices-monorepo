import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface ErrorStateProps {
  /** Main title of the error message */
  title?: string;
  /** Detailed description of what went wrong */
  description?: string;
  /** Optional error message for display (shown in dev mode) */
  error?: unknown;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Label for the retry button */
  retryLabel?: string;
  /** Whether to show the home button */
  showHomeButton?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Generic error state component for displaying errors with retry options.
 * Provides consistent error UI across the application.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "We encountered an unexpected error. Please try again.",
  error,
  onRetry,
  retryLabel = "Try Again",
  showHomeButton = true,
  className = "",
}: ErrorStateProps) {
  // Show error details in development mode
  const isDev = process.env.NODE_ENV === "development";
  const errorMessage = error instanceof Error ? error.message : String(error ?? "");

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {/* Error Icon */}
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>

      {/* Error Message */}
      <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
        {title}
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {description}
      </p>

      {/* Development-only error details */}
      {isDev && errorMessage && (
        <div className="mb-6 p-3 bg-muted rounded-md max-w-md w-full">
          <p className="text-xs font-mono text-destructive break-all">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="default"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {retryLabel}
          </Button>
        )}
        {showHomeButton && (
          <Button
            variant="outline"
            asChild
            className={onRetry ? "" : "gap-2"}
          >
            <a href="/">
              <Home className="h-4 w-4" />
              Go Home
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Inline error state for smaller spaces (e.g., within cards, sections)
 */
export function InlineError({
  message = "Failed to load",
  onRetry,
  className = "",
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 px-4 text-center ${className}`}>
      <AlertCircle className="h-8 w-8 text-destructive mb-2" />
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-3 w-3" />
          Retry
        </Button>
      )}
    </div>
  );
}
