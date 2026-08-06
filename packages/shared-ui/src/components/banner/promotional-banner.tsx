"use client";

import { useEffect, useState, useRef } from "react";
import { X, ExternalLink, Sparkles, ArrowRight, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shoppingService, Banner as BannerType } from "@mymeddevices/shared-core";
import Link from "next/link";

interface PromotionalBannerProps {
  banner: BannerType;
  onDismiss?: () => void;
  className?: string;
}

export function PromotionalBanner({ banner, onDismiss, className }: PromotionalBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [clicked, setClicked] = useState(false);
  const clickTracked = useRef(false);

  // Check if this banner should be hidden based on device
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
      setIsDesktop(window.innerWidth >= 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  if (dismissed) return null;
  if (banner.mobile_hidden && isMobile) return null;
  if (banner.desktop_hidden && isDesktop) return null;

  const handleDismiss = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);

    try {
      await shoppingService.dismissBanner(banner.id);
    } catch (error) {
      console.error("Failed to dismiss banner:", error);
    }

    onDismiss?.();
  };

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    setClicked(true);

    // Track click
    if (!clickTracked.current) {
      clickTracked.current = true;
      try {
        await shoppingService.recordBannerClick(banner.id);
      } catch (error) {
        console.error("Failed to record banner click:", error);
      }
    }

    // Navigate if link exists
    if (banner.cta_link) {
      if (banner.cta_target === "_blank") {
        e.preventDefault();
        window.open(banner.cta_link, "_blank");
      }
    }
  };

  const isHeaderBar = banner.placement === "header_bar";

  const bannerStyle: React.CSSProperties = {
    backgroundColor: banner.background_color || (isHeaderBar ? "#0f172a" : undefined),
    color: banner.text_color || (isHeaderBar ? "#ffffff" : undefined),
  };

  const isDismissible = banner.is_dismissible || banner.show_close_button;

  // Clean, High-Converting Header Bar Layout
  if (isHeaderBar) {
    return (
      <div
        className={cn(
          "relative w-full border-b border-white/10 z-50 text-xs py-2.5 px-4 shadow-sm transition-all duration-300",
          className
        )}
        style={bannerStyle}
      >
        <div className="container mx-auto flex items-center justify-center text-center">
          <div className="flex items-center justify-center gap-2 max-w-full flex-wrap">
            <span className="font-semibold text-xs sm:text-sm tracking-tight">
              {banner.title}
            </span>

            {banner.description && (
              <span className="hidden sm:inline text-xs opacity-90 font-normal border-l border-white/20 pl-2">
                {banner.description}
              </span>
            )}
            {/* Action Button Badge */}
            {(banner.cta_text || banner.button_text) && (banner.cta_link || banner.target_url) && (
              <a
                href={banner.cta_link || banner.target_url}
                onClick={handleClick}
                target={banner.cta_target || "_self"}
                rel={banner.cta_target === "_blank" ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-white text-slate-900 hover:bg-white/90 transition-all shadow-xs ml-1.5 flex-shrink-0 group"
              >
                {banner.cta_text || banner.button_text}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Homepage Hero Banner — Image-First Canva Style (Clickable Image Link, No Text Overlay)
  const isHero = banner.placement === "homepage_hero";
  const alignClass = 
    banner.text_alignment === "left" 
      ? "text-left items-start" 
      : banner.text_alignment === "right" 
      ? "text-right items-end justify-end ml-auto" 
      : "text-center items-center justify-center mx-auto";

  if (isHero) {
    const targetLink = banner.cta_link || banner.target_url;
    return (
      <div className={cn("relative w-full overflow-hidden min-h-[300px] md:min-h-[420px]", className)}>
        {banner.image_url ? (
          targetLink ? (
            <a
              href={targetLink}
              onClick={handleClick}
              target={banner.cta_target || "_self"}
              rel={banner.cta_target === "_blank" ? "noopener noreferrer" : undefined}
              className="block w-full h-full relative group cursor-pointer"
            >
              <div
                className="w-full min-h-[300px] md:min-h-[420px] bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.01]"
                style={{ backgroundImage: `url(${banner.image_url})` }}
                role="img"
                aria-label={banner.image_alt_text || banner.title || "Promotional Banner"}
              />
            </a>
          ) : (
            <div
              className="w-full min-h-[300px] md:min-h-[420px] bg-cover bg-center"
              style={{ backgroundImage: `url(${banner.image_url})` }}
              role="img"
              aria-label={banner.image_alt_text || banner.title || "Promotional Banner"}
            />
          )
        ) : (
          <div
            className="w-full min-h-[300px] md:min-h-[420px] flex items-center justify-center text-slate-400 font-medium"
            style={{ backgroundColor: banner.background_color || "#0f172a" }}
          >
            {banner.title || "Homepage Hero Banner"}
          </div>
        )}

        {isDismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors absolute top-4 right-4 z-20 backdrop-blur-xs border border-white/20"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // Standard Banner Layout for Sidebar / Category Banners
  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={bannerStyle}
    >
      {banner.image_url && (
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${banner.image_url})` }}
            role="img"
            aria-label={banner.image_alt_text || banner.title}
          />
          <div className="absolute inset-0 bg-slate-950/60" />
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={cn("max-w-3xl flex flex-col space-y-3", alignClass)}>
          {banner.title && (
            <h2 className="font-extrabold tracking-tight text-white leading-tight drop-shadow-md text-lg md:text-2xl">
              {banner.title}
            </h2>
          )}
          
          {banner.description && (
            <p className="text-slate-200 font-medium opacity-95 max-w-2xl text-sm">
              {banner.description}
            </p>
          )}

          {(banner.cta_text || banner.button_text) && (banner.cta_link || banner.target_url) && (
            <div className="pt-1">
              <Button
                asChild
                size="default"
                className="font-bold shadow-md"
                style={{
                  backgroundColor: banner.text_color || undefined,
                  color: banner.background_color || undefined,
                }}
              >
                <a
                  href={banner.cta_link || banner.target_url}
                  onClick={handleClick}
                  target={banner.cta_target || "_self"}
                  rel={banner.cta_target === "_blank" ? "noopener noreferrer" : undefined}
                >
                  {banner.cta_text || banner.button_text}
                  {banner.cta_target === "_blank" ? (
                    <ExternalLink className="ml-2 h-4 w-4" />
                  ) : (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  )}
                </a>
              </Button>
            </div>
          )}
        </div>

        {isDismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors absolute top-4 right-4 z-20 backdrop-blur-xs border border-white/20"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
