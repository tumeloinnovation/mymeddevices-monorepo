"use client";

import ProductSection from "@/components/common/ProductSection";
import { HeroSection } from "@/components/layout/hero/HeroSection";
import { ShopByCategories } from "@/components/common/ShopByCategory";
import NewsletterSection from "@/components/layout/footer/NewsLetter";
import { WhyUs } from "@/components/layout/hero/WhyUs";
import { useOnSaleProducts, useFeaturedProducts, useNewArrivals } from "@/lib/hooks/useProducts";
import TrendingSection from "./_components/TrendingSection";
import { ModernProductSection } from "@/components/modern/ModernProductSection";

export default function HomePageClient() {
  const { data: onSaleProducts = [], isLoading: saleLoading } = useOnSaleProducts(10);
  const { data: featuredProducts = [], isLoading: featuredLoading } = useFeaturedProducts(10);
  const { data: newArrivals = [], isLoading: newArrivalsLoading } = useNewArrivals(10);

  return (
    <>
      <HeroSection />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-6">
          <ProductSection
            title="Special Offers"
            description="Discover exclusive deals and discounts on our top products. Limited-time offers you don't want to miss!"
            items={onSaleProducts}
            loading={saleLoading}
          />
        </section>

        <TrendingSection />

        <WhyUs />

        <section className="py-6">
          <ProductSection
            title="Featured Products"
            description="Hand-picked medical devices and equipment curated for quality and reliability."
            items={featuredProducts}
            loading={featuredLoading}
            layout="scroll"
          />
        </section>

        <section className="py-6">
          <ProductSection
            title="New Arrivals"
            description="Be the first to explore our latest medical technology and equipment."
            items={newArrivals}
            loading={newArrivalsLoading}
            layout="scroll"
          />
        </section>

        <ShopByCategories />
      </main>
      <NewsletterSection />
    </>
  );
}