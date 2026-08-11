"use client";

import { useEffect } from "react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import {EmptyState} from "@/components/ui/empty-state";
import { IconBadge } from "@/components/ui/icon-badge";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/utils";
import { GitCompareArrows, Heart, ShoppingCart } from "lucide-react";
import useCartStore from "@/lib/store/useCartStore";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { useCompareStore } from "@/lib/store/useCompareStore";
import { CustomerAuthModal } from "@mymeddevices/shared-ui";
import { useAuthStore, getUserDisplayName, useAuthCookie } from "@mymeddevices/shared-core";
import {
  User,
  Settings as SettingsIcon,
  CreditCard as CreditCardIcon,
  Bell as BellIcon,
  LogOut as LogOutIcon,
  Package as PackageIcon,
  Star,
  MapPin,
  Ticket,
  Award,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserIcon = User;
import ComparePreview from "@/app/(shop)/compare/_components/ComparePreview";
import WishlistPreview from "@/app/(shop)/wishlist/_components/WishlistPreview";

export const MainBarIcons = () => {
  const cartItems = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.getTotal());
  const wishlistItems = useWishlistStore((state) => state.items);
  const compareItems = useCompareStore((state) => state.items);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isAuthenticated, user, getDashboardRoute, logout, hydrated } = useAuthStore();
  const { clearAuthCookie } = useAuthCookie();
  const router = useRouter();

  const avatarUrl = user?.avatar_url;
  const displayName = getUserDisplayName(user);
  const firstName = user?.firstName || displayName.split(' ')[0];

  // Add auth state logging
  useEffect(() => {
    console.log('🔍 [MainBarIcons] Auth state:', {
      hydrated,
      isAuthenticated,
      user: user?.email,
      dashboardRoute: getDashboardRoute(),
    });
  }, [hydrated, isAuthenticated, user, getDashboardRoute]);

  if (!hydrated) {
    console.log('⏳ [MainBarIcons] Waiting for hydration...');
    return null;
  }

  const dashboardRoute = getDashboardRoute();
  const safeDashboardRoute = dashboardRoute === '/' ? '/dashboard' : dashboardRoute;

  const loyaltyPoints = user?.loyaltyPoints ?? (user as any)?.loyalty_points ?? 0;
  const loyaltyTier = user?.loyaltyTier || 'Bronze';

  const menuSections = [
    {
      title: 'Account & Profile',
      items: [
        {
          icon: <User className="h-4 w-4 text-primary" />,
          label: 'My Profile',
          href: `${safeDashboardRoute}/profile`,
        },
        {
          icon: <Award className="h-4 w-4 text-amber-500" />,
          label: 'Loyalty Rewards',
          href: `${safeDashboardRoute}/loyalty`,
          badge: `${loyaltyPoints} pts`,
        },
      ],
    },
    {
      title: 'Shopping & Orders',
      items: [
        {
          icon: <PackageIcon className="h-4 w-4 text-blue-500" />,
          label: 'My Orders',
          href: `${safeDashboardRoute}/orders`,
        },
        {
          icon: <Heart className="h-4 w-4 text-rose-500" />,
          label: 'Wishlist',
          href: `${safeDashboardRoute}/wishlist`,
          badge: wishlistItems.length > 0 ? `${wishlistItems.length}` : undefined,
        },
        {
          icon: <Star className="h-4 w-4 text-amber-400 fill-amber-400" />,
          label: 'My Reviews & Ratings',
          href: `${safeDashboardRoute}/reviews`,
        },
        {
          icon: <MapPin className="h-4 w-4 text-emerald-500" />,
          label: 'Saved Addresses',
          href: `${safeDashboardRoute}/addresses`,
        },
      ],
    },
    {
      title: 'Support & Settings',
      items: [
        {
          icon: <Ticket className="h-4 w-4 text-purple-500" />,
          label: 'Support & Tickets',
          href: `${safeDashboardRoute}/tickets`,
        },
        {
          icon: <CreditCardIcon className="h-4 w-4 text-teal-500" />,
          label: 'Payment Methods',
          href: `${safeDashboardRoute}/payment-methods`,
        },
        {
          icon: <SettingsIcon className="h-4 w-4 text-slate-500" />,
          label: 'Account Settings',
          href: `${safeDashboardRoute}/preferences`,
        },
      ],
    },
  ];

  const handleSignOut = async () => {
    await logout();
    clearAuthCookie();
    router.push('/');
  };

  const renderItemPreview = (items: any[]) => (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col divide-y divide-muted/30"
    >
      {items.map((item) => {
        const id = item?.id ?? item?.sku ?? item?.slug;
        const name = item?.name ?? String(id ?? "");

        // Safely extract image URL with proper fallback
        const getImageSrc = (): string => {
          const rawImage =
            item?.image ??
            (item?.images
              ? Array.isArray(item.images)
                ? item.images[0]?.src ?? item.images[0]?.url ?? item.images[0]
                : undefined
              : undefined);

          // Handle empty string, undefined, null, or empty object
          if (!rawImage || rawImage === "" || (typeof rawImage === "object" && Object.keys(rawImage).length === 0)) {
            return "/logos/logo-portrait.png";
          }

          // If it's a non-empty string, return it
          if (typeof rawImage === "string") {
            return rawImage;
          }

          // If it's an object with src or url property
          if (typeof rawImage === "object") {
            return rawImage?.src ?? rawImage?.url ?? "/logos/logo-portrait.png";
          }

          // Default fallback
          return "/logos/logo-portrait.png";
        };

        const imageSrc = getImageSrc();
        const price = Number(item?.price ?? item?.regular_price ?? 0);

        return (
          <div
            key={String(id) + name}
            className="flex items-center gap-3 p-2 hover:bg-muted/10 rounded-md transition-colors"
          >
            <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0">
              <Image
                src={imageSrc}
                alt={name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {name}
              </p>
              <p className="text-xs text-muted-foreground">
                Ksh {formatCurrency(price)}
              </p>
            </div>
          </div>
        );
      })}
    </motion.div>
  );

  return (
    <div className="flex items-center gap-x-3 md:gap-x-5 relative">

      {/* 🔄 Compare */}
      <HoverCard openDelay={150}>
        <HoverCardTrigger asChild>
          <div className="relative hidden lg:flex flex-col items-center text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer">
            <GitCompareArrows size={20} strokeWidth={1.5} />
            <IconBadge count={compareItems.length} color="secondary" />
            <span className="text-[10px] hidden lg:block mt-0.5">Compare</span>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-64 sm:w-72 md:w-80">
          {compareItems.length ? (
            <ComparePreview />
          ) : (
            <EmptyState
              title="No comparisons yet"
              description="Select items to compare their features."
            />
          )}
        </HoverCardContent>
      </HoverCard>

      {/* 💖 Wishlist */}
      <HoverCard openDelay={150}>
        <HoverCardTrigger asChild>
          <div className="relative hidden lg:flex flex-col items-center text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer">
            <Heart size={20} strokeWidth={1.5} />
            <IconBadge count={wishlistItems.length} color="primary" />
            <span className="text-[10px] hidden lg:block mt-0.5">Wishlist</span>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-64 sm:w-72 md:w-80">
          {wishlistItems.length ? (
            <WishlistPreview />
          ) : (
            <EmptyState
              title="Empty Wishlist"
              description="Save items you love for later."
            />
          )}
        </HoverCardContent>
      </HoverCard>

      {/* 🛒 Cart */}
      <HoverCard openDelay={150}>
        <HoverCardTrigger asChild>
          <div className="relative flex flex-col items-center text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer">
            <ShoppingCart size={20} strokeWidth={1.5} />
            <IconBadge count={cartItems.length} color="danger" />
            <span className="text-[10px] hidden lg:block mt-0.5">Cart</span>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          {cartItems.length ? (
            <div className="space-y-2">
              {renderItemPreview(cartItems)}
              <div className="flex justify-between items-center pt-2 border-t mt-2">
                <span className="text-sm font-medium text-foreground">
                  Total:
                </span>
                <span className="text-sm font-semibold text-primary">
                  Ksh {formatCurrency(cartTotal)}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <Link
                  href="/cart"
                  className="flex-1 text-center py-2 border border-border rounded-md text-sm hover:bg-muted/50 transition-all"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  className="flex-1 text-center py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-all"
                >
                  Checkout
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Your cart is empty"
              description="Start shopping to fill it up!"
            />
          )}
        </HoverCardContent>
      </HoverCard>
      {/* 👤 Account */}
      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="relative flex flex-col items-center text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer">
              <Avatar className="h-5 w-5 border border-primary/20">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-semibold">
                  {displayName[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] hidden lg:block mt-0.5 truncate max-w-[60px]">
                {firstName}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 p-2 shadow-xl border border-border/80" align="end">
            <DropdownMenuLabel className="font-normal p-2">
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold leading-none truncate max-w-[150px]">{displayName}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 capitalize">
                    <ShieldCheck className="w-3 h-3" />
                    {user?.role || 'Customer'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>

                {/* Loyalty Points Banner */}
                <Link
                  href={`${safeDashboardRoute}/loyalty`}
                  className="flex items-center justify-between p-2 mt-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold leading-tight">Loyalty Rewards</span>
                      <span className="text-[9px] text-muted-foreground capitalize">{loyaltyTier} Tier</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      {loyaltyPoints} pts
                    </span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </div>
            </DropdownMenuLabel>

            {menuSections.map((section, sIndex) => (
              <div key={sIndex}>
                <DropdownMenuSeparator className="my-1" />
                <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                  {section.title}
                </div>
                <DropdownMenuGroup>
                  {section.items.map((item, iIndex) => (
                    <DropdownMenuItem
                      key={iIndex}
                      asChild
                      className="cursor-pointer rounded-md focus:bg-accent hover:bg-accent"
                    >
                      <Link href={item.href} className="flex items-center justify-between w-full px-2 py-1.5 text-xs">
                        <div className="flex items-center gap-2.5">
                          {item.icon}
                          <span className="text-popover-foreground font-medium">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </div>
            ))}

            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/40 cursor-pointer flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded-md my-0.5"
            >
              <LogOutIcon className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div
          className="relative hidden lg:flex flex-col items-center text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
          onClick={() => setIsLoginOpen(true)}
        >
          <User size={20} strokeWidth={1.5} />
          <span className="text-[10px] hidden lg:block mt-0.5">Login</span>
        </div>
      )}
      <CustomerAuthModal
        open={isLoginOpen}
        onOpenChange={setIsLoginOpen}
        context="modal"
        initialMode="login"
      />
    </div>
  );
};
