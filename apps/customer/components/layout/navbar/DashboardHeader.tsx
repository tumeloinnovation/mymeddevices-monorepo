'use client';

import { Menu, Store, Sun, Moon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { FC } from 'react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useSidebar } from '@/components/ui/sidebar';

export const DashboardHeader: FC = () => {
    const { theme, setTheme } = useTheme();
    const user = useAuthStore((state) => state.user);
    const { toggleSidebar } = useSidebar();

    const initials = user
        ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
        user.email?.[0]?.toUpperCase() ||
        'U'
        : 'U';

    return (
        <header className="w-full sticky top-0 z-40 bg-background border-b border-border">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-x-4">
                {/* Left Section: Sidebar Toggle + Logo */}
                <div className="flex items-center gap-x-3">
                    {/* Mobile Sidebar Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={toggleSidebar}
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={20} />
                    </Button>

                    {/* Logo - Landscape on desktop, Portrait on mobile */}
                    <Link href="/" className="flex items-center">
                        {/* Landscape Logo - Desktop */}
                        <Image
                            src="/logos/logo-landscape.png"
                            alt="MyMedDevices Logo"
                            width={140}
                            height={35}
                            className="hidden md:block object-contain"
                            priority
                        />
                        {/* Portrait Logo - Mobile */}
                        <Image
                            src="/logos/logo-portrait.png"
                            alt="MyMedDevices Logo"
                            width={40}
                            height={40}
                            className="md:hidden object-contain"
                            priority
                        />
                    </Link>
                </div>

                {/* Right Section: Back to Store + Theme + User */}
                <div className="flex items-center gap-x-2 md:gap-x-4">
                    {/* Back to Store Button */}
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        <Link href="/">
                            <Store size={16} />
                            <span className="hidden sm:inline">Back to Store</span>
                            <span className="sm:hidden">Store</span>
                        </Link>
                    </Button>

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        aria-label="Toggle theme"
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all" />
                    </Button>

                    {/* User Avatar */}
                    <div className="hidden md:flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden lg:block">
                            <p className="text-sm font-medium leading-none">
                                {user?.displayName || user?.firstName || 'Guest'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Customer
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
