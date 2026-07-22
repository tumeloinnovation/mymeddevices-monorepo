"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"

function Input({ className, type, "aria-invalid": ariaInvalid, ...props }: React.ComponentProps<"input">) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const prevInvalid = React.useRef(ariaInvalid)

  // Trigger shake animation when error state changes from false to true
  React.useEffect(() => {
    if (ariaInvalid === true && prevInvalid.current !== true) {
      setHasError(true)
      const timer = setTimeout(() => setHasError(false), 400)
      return () => clearTimeout(timer)
    }
    prevInvalid.current = ariaInvalid
  }, [ariaInvalid])

  const shakeClass = hasError ? "animate-[shake_0.4s_ease-in-out]" : ""

  if (type === "password") {
    return (
      <div className="relative w-full">
        <input
          type={showPassword ? "text" : "password"}
          data-slot="input"
          aria-invalid={ariaInvalid}
          className={cn(
            "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent pl-2.5 pr-9 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
            shakeClass,
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center p-0.5 rounded transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="size-4 pointer-events-none" />
          ) : (
            <Eye className="size-4 pointer-events-none" />
          )}
        </button>
      </div>
    )
  }

  return (
    <input
      type={type}
      data-slot="input"
      aria-invalid={ariaInvalid}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        shakeClass,
        className
      )}
      {...props}
    />
  )
}

export { Input }
