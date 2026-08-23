"use client";

import ProductSection from "@/components/common/ProductSection";
import { HeroSection } from "@/components/layout/hero/HeroSection";
import { ShopByCategories } from "@/components/common/ShopByCategory";
import NewsletterSection from "@/components/layout/footer/NewsLetter";
import { WhyUs } from "@/components/layout/hero/WhyUs";
import { useOnSaleProducts, useNewArrivals } from "@/lib/hooks/useProducts";
import TrendingSection from "./_components/TrendingSection";
import { BannerCarousel, HeaderBanner } from "@mymeddevices/shared-ui";
import { BannerPlacement } from "@mymeddevices/shared-core";
import { TrustFeaturesBar } from "@/components/common/TrustFeaturesBar";
import { LimitedOfferBanner } from "@/components/common/LimitedOfferBanner";
import { CuratedBundlesSection } from "@/components/common/CuratedBundlesSection";

export default function HomePageClient() {
  const { data: onSaleProducts = [], isLoading: saleLoading } = useOnSaleProducts(10);
  const { data: newArrivals = [], isLoading: newArrivalsLoading } = useNewArrivals(10);

  return (
    <>
      <BannerCarousel placement={BannerPlacement.HOMEPAGE_HERO} fallback={<HeroSection />} />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <TrustFeaturesBar />

        <TrendingSection />

        <WhyUs />

        <ShopByCategories />

        <section className="py-6">
          <ProductSection
            title="Special Offers"
            description="Discover exclusive deals and discounts on our top products. Limited-time offers you don't want to miss!"
            items={onSaleProducts}
            loading={saleLoading}
          />
        </section>

        <CuratedBundlesSection />

        <LimitedOfferBanner />

        <section className="py-6">
          <ProductSection
            title="What's New"
            description="Be the first to explore our latest medical technology and equipment."
            items={newArrivals}
            loading={newArrivalsLoading}
            emptyTitle="No New Arrivals"
            emptyMessage="We haven't added any new products recently. Check back soon for the latest medical devices and technology!"
            layout="scroll"
          />
        </section>
      </main>
      <NewsletterSection />
    </>
  );
}