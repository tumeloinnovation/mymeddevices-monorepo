import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { AuthUser } from "../../auth/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-KE');
}

export function getUserDisplayName(user: AuthUser | null | undefined): string {
  if (!user) return 'Guest User';
  return (user.firstName || user.first_name || '') + 
         (user.lastName || user.last_name ? ' ' + (user.lastName || user.last_name) : '') ||
         user.displayName || 
         user.name || 
         user.email?.split('@')[0] || 
         'Guest User';
}
