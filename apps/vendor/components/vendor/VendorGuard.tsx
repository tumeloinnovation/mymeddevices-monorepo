'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, logger } from '@mymeddevices/shared-core';
import { Loader2 } from 'lucide-react';

export default function VendorGuard({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, hydrated } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Wait for store rehydration
        if (!hydrated) return;

        const checkAccess = () => {
            // CRITICAL FIX: Check for refresh token to handle stale auth state from localStorage
            // This prevents redirect loops when cookies are cleared but localStorage persists
            const hasRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
            if (!isAuthenticated || !user || !hasRefreshToken) {
                logger.log('🛡️ [VendorGuard] Access denied: unauthenticated, redirecting to /login');
                router.replace('/login');
                return;
            }

            // 2. Not a vendor -> Redirect to login
            if (user.role !== 'vendor') {
                logger.log('🛡️ [VendorGuard] Access denied: role is not vendor, redirecting to /login', { role: user.role });
                router.replace('/login');
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
                    setIsChecking(false);
                }
                return;
            }

            // 4. Verified vendor accessing pending page -> Redirect to dashboard
            if (isVerified && pathname === '/pending-vendor') {
                router.replace('/vendor/dashboard');
                return;
            }

            // Allowed
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
