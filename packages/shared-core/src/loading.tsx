export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
}

function cx(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <svg
      className={cx("animate-spin", sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export interface FullPageLoadingProps {
  message?: string
}

export function FullPageLoading({ message = "Loading..." }: FullPageLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  )
}

export interface InlineLoadingProps {
  message?: string
  className?: string
}

export function InlineLoading({ message, className }: InlineLoadingProps) {
  return (
    <div className={cx("flex items-center gap-2", className)}>
      <LoadingSpinner size="sm" />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  )
}

export interface TableLoadingProps {
  rowCount?: number
}

export function TableLoading({ rowCount = 5 }: TableLoadingProps) {
  return (
    <div className="w-full space-y-3 p-4">
      {Array.from({ length: rowCount }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="h-12 w-12 animate-pulse rounded bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export interface CardLoadingProps {
  count?: number
}

export function CardLoading({ count = 3 }: CardLoadingProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border p-6"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="space-y-4">
            <div className="h-40 w-full animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cx("animate-pulse rounded bg-muted", className)}
      aria-hidden="true"
    />
  )
}
