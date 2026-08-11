'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@mymeddevices/shared-core';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
    SidebarGroupLabel,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Home,
    Package,
    Heart,
    MapPin,
    Settings,
    LogOut,
    Loader2,
    ChevronsUpDown,
    Store,
    Tag,
    Gift,
    LifeBuoy,
    CreditCard,
    RefreshCw,
    LayoutDashboard,
    User,
    ShoppingCart,
    Truck,
    Lock,
    Eye,
    Bell,
    MessageSquare,
    Clock,
} from 'lucide-react';
import type { NavigationItem } from '@/types/dashboard';
import { toast } from 'sonner';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useState } from 'react';
import { LoginModal } from '@/components/auth/LoginModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { useLogout } from '@/hooks/useLogout';
import { LogoutModal } from '@/components/auth/LogoutModal';

export function DashboardSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, } = useAuthStore();
    const { isMobile, setOpenMobile } = useSidebar();
    const wishlistItems = useWishlistStore((state) => state.items);
    const { handleLogout, isLoggingOut } = useLogout({ redirectPath: '/' });
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    // Navigation groups with categories
    const navigationGroups = [
        {
            label: 'Dashboard',
            items: [
                {
                    label: 'Dashboard',
                    href: '/dashboard',
                    icon: Home,
                    isActive: pathname === '/dashboard',
                },
            ],
        },
        {
            label: 'My Account',
            items: [
                {
                    label: 'Profile',
                    href: '/dashboard/profile',
                    icon: User,
                    isActive: pathname?.startsWith('/dashboard/profile'),
                },
                {
                    label: 'Payment Methods',
                    href: '/dashboard/payment-methods',
                    icon: CreditCard,
                    isActive: pathname?.startsWith('/dashboard/payment-methods'),
                },
                {
                    label: 'Addresses',
                    href: '/dashboard/addresses',
                    icon: MapPin,
                    isActive: pathname?.startsWith('/dashboard/addresses'),
                },
                {
                    label: 'Communication',
                    href: '/dashboard/communication',
                    icon: Bell,
                    isActive: pathname?.startsWith('/dashboard/communication'),
                },
            ],
        },
        {
            label: 'My Orders',
            items: [
                {
                    label: 'Orders',
                    href: '/dashboard/orders',
                    icon: Package,
                    isActive: pathname?.startsWith('/dashboard/orders'),
                },
                {
                    label: 'Returns',
                    href: '/dashboard/returns',
                    icon: RefreshCw,
                    isActive: pathname?.startsWith('/dashboard/returns'),
                },
                {
                    label: 'Order Tracking',
                    href: '/dashboard/tracking',
                    icon: Truck,
                    isActive: pathname?.startsWith('/dashboard/tracking'),
                },
            ],
        },
        {
            label: 'My Stuff',
            items: [
                {
                    label: 'Wishlist',
                    href: '/dashboard/wishlist',
                    icon: Heart,
                    badge: wishlistItems.length,
                    isActive: pathname?.startsWith('/dashboard/wishlist'),
                },
                {
                    label: 'Product Reviews',
                    href: '/dashboard/reviews',
                    icon: MessageSquare,
                    isActive: pathname?.startsWith('/dashboard/reviews'),
                },
                {
                    label: 'Recently Viewed',
                    href: '/dashboard/recently-viewed',
                    icon: Clock,
                    isActive: pathname?.startsWith('/dashboard/recently-viewed'),
                },
            ],
        },
        {
            label: 'Settings',
            items: [
                {
                    label: 'Preferences',
                    href: '/dashboard/preferences',
                    icon: Settings,
                    isActive: pathname?.startsWith('/dashboard/preferences'),
                },
                {
                    label: 'Security',
                    href: '/dashboard/security',
                    icon: Lock,
                    isActive: pathname?.startsWith('/dashboard/security'),
                },
                {
                    label: 'Privacy',
                    href: '/dashboard/privacy',
                    icon: Eye,
                    isActive: pathname?.startsWith('/dashboard/privacy'),
                },
            ],
        },
    ];

    const initials = user
        ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
        user.email?.[0]?.toUpperCase() ||
        'U'
        : 'U';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-2">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Store className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold">MyMedDevices</span>
                        <span className="truncate text-xs">Customer Portal</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {navigationGroups.map((group) => (
                    <SidebarGroup key={group.label}>
                        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={item.isActive}
                                            tooltip={item.label}
                                        >
                                            <Link href={item.href}>
                                                <item.icon />
                                                <span>{item.label}</span>
                                                {'badge' in item && item.badge !== undefined && item.badge > 0 && (
                                                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        size="lg"
                                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                    >
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                            <span className="truncate font-semibold">
                                                {user?.displayName || user?.firstName || 'User'}
                                            </span>
                                            <span className="truncate text-xs text-muted-foreground">
                                                {user?.email}
                                            </span>
                                        </div>
                                        <ChevronsUpDown className="ml-auto size-4" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-64 p-2 rounded-lg shadow-lg border border-border"
                                    side={isMobile ? 'bottom' : 'right'}
                                    align="end"
                                    sideOffset={4}
                                >
                                    <DropdownMenuLabel className="p-1 font-normal">
                                        <div className="flex flex-col space-y-1.5 px-1 py-1">
                                            <div className="flex items-center justify-between">
                                                <span className="truncate font-semibold text-sm">
                                                    {user?.displayName || user?.firstName || 'User'}
                                                </span>
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary capitalize">
                                                    {user?.role || 'Customer'}
                                                </span>
                                            </div>
                                            <span className="truncate text-xs text-muted-foreground">
                                                {user?.email}
                                            </span>
                                            <Link
                                                href="/dashboard/loyalty"
                                                className="flex items-center justify-between p-1.5 mt-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 transition-all text-xs"
                                            >
                                                <span className="flex items-center gap-1.5 font-medium text-[11px]">
                                                    <Gift className="w-3.5 h-3.5 text-amber-500" />
                                                    Rewards
                                                </span>
                                                <span className="font-bold text-[11px] px-1.5 py-0.2 rounded bg-amber-500/20">
                                                    {user?.loyaltyPoints ?? (user as any)?.loyalty_points ?? 0} pts
                                                </span>
                                            </Link>
                                        </div>
                                    </DropdownMenuLabel>

                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard/profile" className="flex items-center w-full cursor-pointer text-xs">
                                                <User className="mr-2 h-3.5 w-3.5 text-primary" />
                                                My Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard/orders" className="flex items-center w-full cursor-pointer text-xs">
                                                <Package className="mr-2 h-3.5 w-3.5 text-blue-500" />
                                                My Orders
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard/reviews" className="flex items-center w-full cursor-pointer text-xs">
                                                <MessageSquare className="mr-2 h-3.5 w-3.5 text-amber-400" />
                                                My Reviews
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard/tickets" className="flex items-center w-full cursor-pointer text-xs">
                                                <LifeBuoy className="mr-2 h-3.5 w-3.5 text-purple-500" />
                                                Support Tickets
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard/preferences" className="flex items-center w-full cursor-pointer text-xs">
                                                <Settings className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                                Account Settings
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>

                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 dark:text-red-400 cursor-pointer text-xs font-medium">
                                        <LogOut className="mr-2 h-3.5 w-3.5" />
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                    onClick={() => {
                                        setOpenMobile(false);
                                        setIsLoginOpen(true);
                                    }}
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                        <span className="truncate font-semibold">User</span>
                                        <span className="truncate text-xs text-muted-foreground"></span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                                <LoginModal open={isLoginOpen} onOpenChange={(open) => setIsLoginOpen(open)} />
                            </>
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
            
            <LogoutModal open={isLoggingOut} />
        </Sidebar>
    );
}
