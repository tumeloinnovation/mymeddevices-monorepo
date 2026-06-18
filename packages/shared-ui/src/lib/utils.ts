import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Screen reader only utility class
 * Hides content visually but keeps it accessible for screen readers
 */
export function srOnly() {
  return 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 sr-only'
}
