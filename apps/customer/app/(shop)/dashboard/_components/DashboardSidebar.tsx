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
    Clock,
    Search,
    FileText,
    Shield,
    Lock,
    Eye,
    Bell,
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
                    label: 'Recently Viewed',
                    href: '/dashboard/recently-viewed',
                    icon: Clock,
                    isActive: pathname?.startsWith('/dashboard/recently-viewed'),
                },
                {
                    label: 'Saved Searches',
                    href: '/dashboard/saved-searches',
                    icon: Search,
                    isActive: pathname?.startsWith('/dashboard/saved-searches'),
                },
            ],
        },
        {
            label: 'Medical',
            items: [
                {
                    label: 'Prescriptions',
                    href: '/dashboard/prescriptions',
                    icon: FileText,
                    isActive: pathname?.startsWith('/dashboard/prescriptions'),
                },
                {
                    label: 'Insurance',
                    href: '/dashboard/insurance',
                    icon: Shield,
                    isActive: pathname?.startsWith('/dashboard/insurance'),
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
                                                {item.badge !== undefined && item.badge > 0 && (
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
                                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                    side={isMobile ? 'bottom' : 'right'}
                                    align="end"
                                    sideOffset={4}
                                >
                                    <DropdownMenuLabel className="p-0 font-normal">
                                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                            <Avatar className="h-8 w-8 rounded-lg">
                                                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span className="truncate font-semibold">
                                                    {user?.displayName || user?.firstName || 'User'}
                                                </span>
                                                <span className="truncate text-xs text-muted-foreground">
                                                    {user?.email}
                                                </span>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard/settings" className="flex items-center w-full cursor-pointer">
                                                <Settings className="mr-2 h-4 w-4" />
                                                Settings
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout}>
                                        <LogOut className="mr-2 h-4 w-4" />
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
