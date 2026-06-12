"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "./store"
import type { UserRole } from "./types"

export function useAuthGuard(allowedRoles?: UserRole[]) {
  const { isAuthenticated, hydrated, user, isAdmin, isVendor, isCustomer } = useAuthStore()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!hydrated) return

    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    if (allowedRoles && allowedRoles.length > 0 && user) {
      const hasRole = allowedRoles.some((role) => {
        if (role === "admin") return isAdmin()
        if (role === "vendor") return isVendor()
        if (role === "customer") return isCustomer()
        return user.role === role
      })

      if (!hasRole) {
        router.replace("/")
        return
      }
    }

    setChecking(false)
  }, [hydrated, isAuthenticated, user, router, allowedRoles, isAdmin, isVendor, isCustomer])

  return {
    checking: !hydrated || checking,
    isAuthorized: hydrated && isAuthenticated,
  }
}

export function AuthGuard({
  children,
  allowedRoles,
  fallback,
}: {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  fallback?: React.ReactNode
}) {
  const { checking } = useAuthGuard(allowedRoles)

  if (checking) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
        </div>
      )
    )
  }

  return <>{children}</>
}

export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { checking, isAuthorized } = useAuthGuard(allowedRoles)
  return { isLoading: checking, isAuthenticated: isAuthorized }
}

export function useAuthCookie() {
  const setCookie = useCallback((token: string) => {
    if (typeof document === "undefined") return
    // Use Strict for improved security. Consider setting cookies server-side with HttpOnly and Secure flags
    document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`
  }, [])

  const clearCookie = useCallback(() => {
    if (typeof document === "undefined") return
    document.cookie = "auth-token=; path=/; max-age=0; SameSite=Strict"
  }, [])

  return { setAuthCookie: setCookie, clearAuthCookie: clearCookie }
}
