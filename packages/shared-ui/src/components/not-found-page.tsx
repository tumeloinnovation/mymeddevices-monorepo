"use client"

import { cn } from '../lib/utils'
import MonitorIllustration from './404-illustration'

interface NotFoundPageProps {
  description?: string
  hint?: string
  primaryHref?: string
  primaryText?: string
  secondaryHref?: string
  secondaryText?: string
  className?: string
}

export function NotFoundPage({
  description = "Page not found",
  hint = "The page you are looking for doesn't exist or has been moved.",
  primaryHref = "/dashboard",
  primaryText = "Go to Dashboard",
  secondaryHref,
  secondaryText,
  className,
}: NotFoundPageProps) {
  return (
    <div className={cn("flex min-h-screen flex-col items-center justify-center bg-background px-4", className)}>
      <div className="text-center">
        <div className="flex justify-center">
          <MonitorIllustration />
        </div>
        
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {description}
        </h1>
        
        {hint && (
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            {hint}
          </p>
        )}
        
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={primaryHref}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {primaryText}
          </a>
          {secondaryHref && secondaryText && (
            <a
              href={secondaryHref}
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {secondaryText}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}