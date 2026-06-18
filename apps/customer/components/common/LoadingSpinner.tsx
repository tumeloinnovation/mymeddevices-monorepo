import React from "react";
import { cn } from "@/lib/utils/utils";

type SpinnerSize = "small" | "medium" | "large";

interface LoadingSpinnerProps {
  /** Size variant of the spinner */
  size?: SpinnerSize;
  /** Additional CSS classes */
  className?: string;
  /** Optional text to display below the spinner */
  label?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  small: "h-4 w-4 border-2",
  medium: "h-6 w-6 border-2",
  large: "h-8 w-8 border-3",
};

/**
 * Reusable loading spinner component.
 * Use for inline loading states throughout the application.
 */
export function LoadingSpinner({
  size = "medium",
  className = "",
  label,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", label ? "gap-2" : "", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-primary border-t-transparent",
          sizeClasses[size]
        )}
      />
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

/**
 * Full-page loading overlay
 */
export function FullPageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="large" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/**
 * Centered loading state for sections
 */
export function SectionLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner label={label} />
    </div>
  );
}

/**
 * Small inline spinner for buttons and compact spaces
 */
export function InlineSpinner() {
  return <LoadingSpinner size="small" />;
}
