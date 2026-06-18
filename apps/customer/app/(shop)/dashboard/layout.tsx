'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@mymeddevices/shared-core';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Sun, Moon, Store } from 'lucide-react';
import Link from 'next/link';
import { DashboardSidebar } from './_components/DashboardSidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isVendor, hydrated, user } = useAuthStore();
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        console.log('🔍 [DashboardLayout] Auth state:', {
            isAuthenticated,
            isVendor: isVendor(),
            hydrated,
            user: user?.email,
            pathname,
        });

        // Wait for hydration before making any decisions
        if (!hydrated) {
            console.log('⏳ [DashboardLayout] Waiting for hydration...');
            return;
        }

        // Redirect vendors to their dashboard
        if (isVendor()) {
            console.log('🔄 [DashboardLayout] Redirecting vendor to /vendor/dashboard');
            router.replace('/vendor/dashboard');
            return;
        }

        // Only redirect if definitely not authenticated (after hydration)
        if (!isAuthenticated) {
            console.log('🚫 [DashboardLayout] Not authenticated, redirecting to /login');
            router.replace(`/login?returnUrl=${pathname}`);
        } else {
            console.log('✅ [DashboardLayout] User authenticated, allowing access');
        }
    }, [isAuthenticated, hydrated, isVendor, router, user, pathname]);

    // Show loading state while hydrating
    if (!hydrated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
                    <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Don't render for vendors (they'll be redirected)
    if (isVendor()) {
        return null;
    }

    // Show loading state while checking auth
    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
                    <p className="text-sm text-muted-foreground">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <SidebarProvider defaultOpen={true}>
            <DashboardSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold">Dashboard</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <Link href="/">
                                <Store size={16} />
                                <span>Back to Store</span>
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            aria-label="Toggle theme"
                        >
                            <Sun className="h-5 w-5 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all" />
                            <Moon className="absolute h-5 w-5 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all" />
                        </Button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto bg-muted/10 p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
