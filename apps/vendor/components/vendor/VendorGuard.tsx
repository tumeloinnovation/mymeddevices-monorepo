'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, logger } from '@mymeddevices/shared-core';
import { Loader2 } from 'lucide-react';

export default function VendorGuard({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, hydrated } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);
    const hasPassedGuardRef = useRef(false);

    useEffect(() => {
        // Wait for store rehydration
        if (!hydrated) return;

        // Skip checks if we've already validated and are just navigating between authorized pages
        // Only re-check if auth state changes (user, isAuthenticated), not on every pathname change
        if (hasPassedGuardRef.current && isAuthenticated && user) {
            setIsChecking(false);
            return;
        }

        const checkAccess = () => {
            // CRITICAL FIX: Check for refresh token to handle stale auth state from localStorage
            // This prevents redirect loops when cookies are cleared but localStorage persists
            const hasRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
            if (!isAuthenticated || !user || !hasRefreshToken) {
                logger.log('🛡️ [VendorGuard] Access denied: unauthenticated, redirecting to /login');
                hasPassedGuardRef.current = false;
                // Only redirect if not already on login page to prevent loops
                if (pathname !== '/login') {
                    const returnUrl = encodeURIComponent(pathname);
                    router.replace(`/login?returnUrl=${returnUrl}`);
                }
                return;
            }

            // 2. Not a vendor -> Redirect to login
            if (user.role !== 'vendor') {
                logger.log('🛡️ [VendorGuard] Access denied: role is not vendor, redirecting to /login', { role: user.role });
                hasPassedGuardRef.current = false;
                if (pathname !== '/login') {
                    router.replace('/login?error=vendor_role_required');
                }
                return;
            }

            // 3. Vendor not verified
            // Check both camelCase (TypeScript type) and snake_case (backend response)
            // Default to true if user successfully authenticated as vendor
            const isVerified = (user as any).isVendorVerified ?? (user as any).is_vendor_verified ?? true;

            // If strictly checking specific vendor routes that require verification
            // The /vendor/pending page should be accessible to unverified vendors
            if (!isVerified) {
                if (pathname !== '/pending-vendor') {
                    router.replace('/pending-vendor');
                } else {
                    // Allow access to pending page
                    hasPassedGuardRef.current = true;
                    setIsChecking(false);
                }
                return;
            }

            // 4. Verified vendor accessing pending page -> Redirect to dashboard
            if (isVerified && pathname === '/pending-vendor') {
                router.replace('/vendor/dashboard');
                return;
            }

            // Allowed - mark as passed to skip checks on subsequent navigations
            hasPassedGuardRef.current = true;
            setIsChecking(false);
        };

        checkAccess();
    }, [user, isAuthenticated, hydrated, pathname, router]);

    // Show loading state while checking or hydrating
    if (!hydrated || isChecking) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return <>{children}</>;
}
