"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shoppingService, BannerPlacement, Banner as BannerType } from "@mymeddevices/shared-core";

interface LimitedOfferBannerProps {
  className?: string;
  tag?: string;
  title?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  imageSrc?: string;
}

export const LimitedOfferBanner: React.FC<LimitedOfferBannerProps> = ({
  className,
  tag = "LIMITED OFFER",
  title = "Exclusive Medical Equipment Collection",
  description = "Up to 30% off on selected certified devices. Limited time offer!",
  ctaText = "Shop Now",
  ctaLink = "/offers",
  imageSrc = "/images/limited-offer-device.png",
}) => {
  const [dynamicBanner, setDynamicBanner] = useState<BannerType | null>(null);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const banners = await shoppingService.getPublicBanners({
          placement: BannerPlacement.CATEGORY_PAGE,
          limit: 1,
        });
        if (Array.isArray(banners) && banners.length > 0) {
          setDynamicBanner(banners[0]);
        }
      } catch {
        // Fallback to static design
      }
    };

    fetchBanner();
  }, []);

  const displayTag = (dynamicBanner as any)?.badge_text || tag;
  const displayTitle = dynamicBanner?.title || title;
  const displayDescription = dynamicBanner?.description || description;
  const displayCtaText = dynamicBanner?.cta_text || dynamicBanner?.button_text || ctaText;
  const displayCtaLink = dynamicBanner?.cta_link || dynamicBanner?.target_url || ctaLink;
  const displayImage = dynamicBanner?.image_url || imageSrc;

  return (
    <section className={cn("py-4 sm:py-6", className)} aria-label="Limited Offer Promotion">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0a1510] via-[#0d1e17] to-[#060e0a] border border-emerald-950/60 shadow-xl p-5 sm:p-6 md:p-8 lg:px-10 lg:py-6">
        {/* Ambient Glowing Background Accents */}
        <div
          className="absolute -left-16 -top-16 w-60 h-60 rounded-full bg-emerald-600/15 blur-[70px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute right-10 bottom-0 w-72 h-72 rounded-full bg-teal-500/10 blur-[80px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Decorative Grid Mesh */}
        <div
          className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8 items-center">
          {/* Left: Featured 3D Product Image (Compact) */}
          <div className="md:col-span-5 flex items-center justify-center order-2 md:order-1">
            <div className="relative w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] h-36 sm:h-44 md:h-48 flex items-center justify-center group">
              <div className="absolute inset-2 rounded-full bg-emerald-500/20 blur-xl group-hover:bg-emerald-400/25 transition-all duration-500" />
              <div className="relative w-full h-full transform transition-transform duration-500 ease-out group-hover:scale-105">
                <Image
                  src={displayImage}
                  alt={displayTitle}
                  fill
                  sizes="(max-width: 640px) 200px, (max-width: 1024px) 240px, 280px"
                  className="object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Right: Promotional Content */}
          <div className="md:col-span-7 flex flex-col items-start text-left order-1 md:order-2 space-y-2.5 sm:space-y-3">
            {/* Tag / Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-[0.18em] shadow-xs backdrop-blur-xs">
              <Sparkles className="w-3 h-3" />
              <span>{displayTag}</span>
            </div>

            {/* Headline */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug max-w-lg">
              {displayTitle}
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-emerald-100/75 font-normal leading-relaxed max-w-md">
              {displayDescription}
            </p>

            {/* CTA Button */}
            <div className="pt-1 sm:pt-2">
              <Button
                asChild
                size="sm"
                className="h-9 sm:h-10 px-5 sm:px-6 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm transition-all duration-300 hover:scale-105 shadow-md shadow-emerald-500/20 group cursor-pointer border-0"
              >
                <Link href={displayCtaLink} className="flex items-center gap-1.5">
                  <span>{displayCtaText}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LimitedOfferBanner;
