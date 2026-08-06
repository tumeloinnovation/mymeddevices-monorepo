"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PromotionalBanner } from "./promotional-banner";
import { shoppingService, BannerPlacement, Banner as BannerType } from "@mymeddevices/shared-core";

interface BannerCarouselProps {
  placement?: BannerPlacement;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
  maxBanners?: number;
  fallback?: React.ReactNode;
}

// In-memory cache to prevent layout flash on navigation
const bannerCache: Record<string, BannerType[]> = {};

export function BannerCarousel({
  placement = BannerPlacement.HOMEPAGE_HERO,
  autoPlay = true,
  autoPlayInterval = 5000,
  className,
  maxBanners = 5,
  fallback = null,
}: BannerCarouselProps) {
  const [banners, setBanners] = useState<BannerType[]>(() => bannerCache[placement] || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(!bannerCache[placement]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchBanners = async () => {
      // If we don't have cached data, set loading state
      if (!bannerCache[placement]) {
        setLoading(true);
      }
      try {
        const data = await shoppingService.getPublicBanners({
          placement,
          limit: maxBanners,
        });
        const result = Array.isArray(data) ? data : [];
        bannerCache[placement] = result;
        setBanners(result);
      } catch (error) {
        console.error("Failed to fetch banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [placement, maxBanners]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const visibleBanners = banners.filter(b => !dismissedIds.has(b.id));
        if (visibleBanners.length === 0) return 0;

        const visibleIndex = visibleBanners.findIndex(b => b.id === banners[prev].id);
        const nextIndex = (visibleIndex + 1) % visibleBanners.length;
        return banners.findIndex(b => b.id === visibleBanners[nextIndex].id);
      });
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, banners, dismissedIds]);

  const visibleBanners = banners.filter(b => !dismissedIds.has(b.id));

  if (loading) {
    const isHeaderBar = placement === BannerPlacement.HEADER_BAR;
    return (
      <div
        className={cn(
          "w-full animate-pulse bg-slate-900/10 dark:bg-slate-100/10 flex items-center justify-center transition-all",
          isHeaderBar ? "h-9 py-1.5" : "h-72 py-4",
          className
        )}
      >
        {isHeaderBar && (
          <div className="h-3.5 w-64 bg-slate-400/30 rounded-full animate-pulse" />
        )}
      </div>
    );
  }

  if (visibleBanners.length === 0) {
    return <>{fallback}</>;
  }

  const currentBanner = visibleBanners[currentIndex];

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % visibleBanners.length;
    setCurrentIndex(nextIndex);
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + visibleBanners.length) % visibleBanners.length;
    setCurrentIndex(prevIndex);
  };

  const handleDismiss = (bannerId: string) => {
    setDismissedIds(prev => new Set([...prev, bannerId]));

    // Move to next banner if current one was dismissed
    if (visibleBanners.length > 1) {
      handleNext();
    }
  };

  // For single banner, just render it without carousel controls
  if (visibleBanners.length === 1) {
    return (
      <PromotionalBanner
        banner={visibleBanners[0]}
        onDismiss={() => handleDismiss(visibleBanners[0].id)}
        className={className}
      />
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Banner */}
      <PromotionalBanner
        key={currentBanner.id}
        banner={currentBanner}
        onDismiss={() => handleDismiss(currentBanner.id)}
      />

      {/* Carousel Controls */}
      {visibleBanners.length > 1 && (
        <>
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg opacity-0 hover:opacity-100 transition-opacity"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg opacity-0 hover:opacity-100 transition-opacity"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {visibleBanners.map((banner, index) => (
              <button
                key={banner.id}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === currentIndex
                    ? "w-8 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/75"
                )}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Header bar banner component (static, no carousel)
export function HeaderBanner() {
  const [banners, setBanners] = useState<BannerType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await shoppingService.getPublicBanners({
          placement: BannerPlacement.HEADER_BAR,
          limit: 1,
        });
        setBanners(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch header banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (loading || banners.length === 0) return null;

  return (
    <PromotionalBanner
      banner={banners[0]}
      className="w-full"
    />
  );
}

// Footer banner component (static, no carousel)
export function FooterBanner() {
  const [banners, setBanners] = useState<BannerType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await shoppingService.getPublicBanners({
          placement: BannerPlacement.FOOTER,
          limit: 1,
        });
        setBanners(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch footer banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (loading || banners.length === 0) return null;

  return (
    <PromotionalBanner
      banner={banners[0]}
      className="w-full"
    />
  );
}
