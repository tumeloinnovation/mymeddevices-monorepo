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
import { User, Settings as SettingsIcon, CreditCard as CreditCardIcon, Bell as BellIcon, LogOut as LogOutIcon, Package as PackageIcon } from "lucide-react";
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

  const listItems = [
    {
      icon: <UserIcon className="h-4 w-4" />,
      property: 'Profile',
      href: safeDashboardRoute
    },
    {
      icon: <PackageIcon className="h-4 w-4" />,
      property: 'My Orders',
      href: `${safeDashboardRoute}/orders`
    },
    {
      icon: <Heart className="h-4 w-4" />,
      property: 'Wishlist',
      href: `${safeDashboardRoute}/wishlist`
    },
    {
      icon: <SettingsIcon className="h-4 w-4" />,
      property: 'Saved Addresses',
      href: `${safeDashboardRoute}/addresses`
    },
    {
      icon: <SettingsIcon className="h-4 w-4" />,
      property: 'Settings',
      href: `${safeDashboardRoute}/settings`
    },
    {
      icon: <CreditCardIcon className="h-4 w-4" />,
      property: 'Billing',
      href: `${safeDashboardRoute}/payment-methods`
    },
    {
      icon: <BellIcon className="h-4 w-4" />,
      property: 'Notifications',
      href: `${safeDashboardRoute}/settings`
    },
    {
      icon: <LogOutIcon className="h-4 w-4" />,
      property: 'Sign Out',
      onClick: async () => {
        await logout();
        clearAuthCookie();
        router.push('/');
      }
    }
  ];

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
              <Avatar className="h-5 w-5">
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
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {listItems.map((item, index) => (
                item.onClick ? (
                  <DropdownMenuItem
                    key={index}
                    className="*:[svg]:text-muted-foreground cursor-pointer flex items-center gap-2"
                    onClick={item.onClick}
                  >
                    {item.icon}
                    <span className="text-popover-foreground">{item.property}</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    key={index}
                    asChild
                    className="*:[svg]:text-muted-foreground cursor-pointer"
                  >
                    <Link href={item.href || '#'} className="flex items-center gap-2 w-full">
                      {item.icon}
                      <span className="text-popover-foreground">{item.property}</span>
                    </Link>
                  </DropdownMenuItem>
                )
              ))}
            </DropdownMenuGroup>
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
