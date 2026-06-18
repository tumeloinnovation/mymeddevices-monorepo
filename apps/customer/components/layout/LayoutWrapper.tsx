'use client';

import { usePathname } from 'next/navigation';
import { BreadcrumbWrapper } from '@/components/layout/breadcrumb/BreadcrumbWrapper';
import { Footer } from '@/components/layout/footer/Footer';
import { Navbar } from '@/components/layout/navbar';

interface LayoutWrapperProps {
    children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
    const pathname = usePathname();

    // Hide breadcrumb and footer on dashboard, vendor, and admin routes, but show navbar/footer on auth routes
    const isDashboardRoute = pathname?.startsWith('/dashboard');
    const isVendorRoute = pathname?.startsWith('/vendor');
    const isAdminRoute = pathname?.startsWith('/admin');
    const isAuthRoute = pathname?.startsWith('/register');
    const hideNavigation = isDashboardRoute || isVendorRoute || isAdminRoute;

    return (
        <>
            {/* Render Navbar for non-dashboard/vendor routes (including auth routes) */}
            {!hideNavigation && <Navbar />}
            {/* Hide breadcrumbs on dashboard, vendor, and auth routes */}
            {!hideNavigation && !isAuthRoute && <BreadcrumbWrapper />}
            {children}
            {/* Render Footer for non-dashboard/vendor routes (including auth routes) */}
            {!hideNavigation && <Footer />}
        </>
    );
}
