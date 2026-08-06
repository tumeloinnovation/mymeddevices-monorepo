'use client';

import { IconBadge } from '@/components/ui/icon-badge';
import { NavigationLink } from '@/components/ui/navigation-link';
import useCartStore from '@/lib/store/useCartStore';
import { useCompareStore } from '@/lib/store/useCompareStore';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { formatCurrency } from '@/lib/utils/utils';
import { GitCompareArrows, Heart, Phone, ShoppingCart, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { BottomBar } from './BottomBar';
import { MainBar } from './MainBar';
import { TopBar } from './TopBar';
import { LoginModal } from '@/components/auth/LoginModal';
import { useAuthStore } from '@mymeddevices/shared-core';

import { BannerCarousel } from '@mymeddevices/shared-ui';
import { BannerPlacement } from '@mymeddevices/shared-core';

export const Navbar: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCheckoutPage = pathname === '/checkout';
  const { isAuthenticated, user, getDashboardRoute } = useAuthStore();

  useEffect(() => {
    const loginParam = searchParams.get('login');
    console.log('🔍 [Navbar] URL login param check:', { loginParam, pathname, searchParams: searchParams.toString() });

    if (loginParam === 'true') {
      console.log('🚨 [Navbar] Opening login modal due to login=true param');
      setIsLoginOpen(true);
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('login');
      const newUrl = pathname + (newParams.toString() ? `?${newParams.toString()}` : '');
      console.log('🔧 [Navbar] Cleaning URL, new URL:', newUrl);
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  // Store hooks
  const cartItems = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.getTotal());
  const cartHydrated = useCartStore((state) => state.hydrated);
  const wishlistItems = useWishlistStore((state) => state.items);
  const wishlistHydrated = useWishlistStore((state) => state.hydrated);
  const compareItems = useCompareStore((state) => state.items);
  const compareHydrated = useCompareStore((state) => state.hydrated);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`w-full sticky top-0 z-40 bg-background transition-shadow ${isScrolled ? 'shadow-md' : ''
        }`}
    >
      {/* Top Announcement Bar — Rendered above the TopBar social links section */}
      <BannerCarousel placement={BannerPlacement.HEADER_BAR} />

      <TopBar theme={theme} setTheme={setTheme} />

      <MainBar isMenuOpen={isMenuOpen} toggleMenu={() => setIsMenuOpen((prev) => !prev)} />

      {/* Hide BottomBar on checkout page */}
      {!isCheckoutPage && (
        <div
          className="hidden md:block border-t border-border transition-all duration-300 ease-in-out"
        >
          <BottomBar />
        </div>
      )}

      {/* Mobile Menu */}
      <div
        className={`lg:hidden bg-background border-t border-border overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <nav className="p-4 flex flex-col gap-y-4">
          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Cart */}
            <Link
              href="/cart"
              className="flex items-center gap-x-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="relative">
                <ShoppingCart size={20} className="text-muted-foreground" />
                <div className="absolute -top-2 -right-2">
                  <IconBadge count={cartHydrated ? cartItems.length : 0} color="danger" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Cart</p>
                <p className="text-xs text-muted-foreground">
                  Ksh {cartHydrated ? formatCurrency(cartTotal) : '0'}
                </p>
              </div>
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="flex items-center gap-x-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="relative">
                <Heart size={20} className="text-muted-foreground" />
                <div className="absolute -top-2 -right-2">
                  <IconBadge count={wishlistHydrated ? wishlistItems.length : 0} color="primary" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Wishlist</p>
                <p className="text-xs text-muted-foreground">
                  {wishlistHydrated ? wishlistItems.length : 0} items
                </p>
              </div>
            </Link>

            {/* Compare */}
            <Link
              href="/compare"
              className="flex items-center gap-x-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="relative">
                <GitCompareArrows size={20} className="text-muted-foreground" />
                <div className="absolute -top-2 -right-2">
                  <IconBadge count={compareHydrated ? compareItems.length : 0} color="secondary" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Compare</p>
                <p className="text-xs text-muted-foreground">
                  {compareHydrated ? compareItems.length : 0} items
                </p>
              </div>
            </Link>

            {/* Account */}
            {isAuthenticated ? (
              <Link
                href={getDashboardRoute()}
                className="flex items-center gap-x-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-all duration-200 text-left w-full"
                onClick={() => setIsMenuOpen(false)}
              >
                <User size={20} className="text-muted-foreground" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{user?.displayName || user?.firstName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </Link>
            ) : (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsLoginOpen(true);
                }}
                className="flex items-center gap-x-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-all duration-200 text-left w-full"
              >
                <User size={20} className="text-muted-foreground" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">Account</p>
                  <p className="text-xs text-muted-foreground">Guest</p>
                </div>
              </button>
            )}
          </div>

          {/* Contact Info */}
          <Link
            href="tel:+254734585958"
            className="flex items-center gap-x-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-all duration-200"
          >
            <Phone size={20} className="text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Call us</p>
              <p className="text-xs text-muted-foreground">+254 707 757 088</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="border-t border-border pt-4 space-y-2">
            <NavigationLink
              href="/categories"
              className="block py-2 px-3 rounded-md hover:bg-muted transition-all duration-200 hover:translate-x-1 hover:text-primary"
              pendingClassName="opacity-50 pointer-events-none"
              onClick={() => setIsMenuOpen(false)}
            >
              Shop By Category
            </NavigationLink>
            <NavigationLink
              href="/best-sellers"
              className="block py-2 px-3 rounded-md hover:bg-muted transition-all duration-200 hover:translate-x-1 hover:text-primary"
              pendingClassName="opacity-50 pointer-events-none"
              onClick={() => setIsMenuOpen(false)}
            >
              Best Sellers
            </NavigationLink>
            <NavigationLink
              href="/new-arrivals"
              className="block py-2 px-3 rounded-md hover:bg-muted transition-all duration-200 hover:translate-x-1 hover:text-primary"
              pendingClassName="opacity-50 pointer-events-none"
              onClick={() => setIsMenuOpen(false)}
            >
              New Arrivals
            </NavigationLink>
            <NavigationLink
              href="/featured"
              className="block py-2 px-3 rounded-md hover:bg-muted transition-all duration-200 hover:translate-x-1 hover:text-primary"
              pendingClassName="opacity-50 pointer-events-none"
              onClick={() => setIsMenuOpen(false)}
            >
              Featured Products
            </NavigationLink>
            <NavigationLink
              href="/offers"
              className="block py-2 px-3 rounded-md hover:bg-muted transition-all duration-200 hover:translate-x-1 hover:text-primary"
              pendingClassName="opacity-50 pointer-events-none"
              onClick={() => setIsMenuOpen(false)}
            >
              Offers
            </NavigationLink>
          </div>
        </nav>
      </div>

      {/* Login Modal */}
      <LoginModal open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </header>
  );
};
