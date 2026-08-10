"use client";

import React, { useState, useMemo } from "react";
import { PackageSearch } from "lucide-react";
import NewsletterSection from "@/components/layout/footer/NewsLetter";
import OfferCard from "./OfferCard";
import OffersHeroSection from "@/components/common/OffersHeroSection";
import { useOnSaleProducts } from "@/lib/hooks/useProducts";
import { ProductGridSkeleton } from "@/components/common/ProductGridSkeleton";
import { ErrorState } from "@/components/common/ErrorState";

const getCategoryTitle = (category: string) => {
  switch (category) {
    case "limited-time": return "Limited-Time Offers";
    case "care-team": return "Care Team Offers";
    case "home-essentials": return "Home Essentials Offers";
    default: return "All Offers";
  }
};

const OffersPage: React.FC = () => {
  const { data: saleProducts = [], isLoading, isError, error } = useOnSaleProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredOffers = useMemo(() => {
    if (selectedCategory !== "all") {
      return saleProducts.filter((offer) =>
        offer.tags?.some((tag: any) => tag.slug === selectedCategory)
      );
    }
    return saleProducts;
  }, [saleProducts, selectedCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <OffersHeroSection />
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <OffersHeroSection />
          <ErrorState
            title="Failed to load offers"
            description="We couldn't load the current offers. Please try again."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4">
        <OffersHeroSection
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Offers Grid */}
        <div className="mb-16">
          {filteredOffers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center">
              {filteredOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border bg-card/40 my-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <PackageSearch className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">No offers available in this filter</h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-5 leading-relaxed">
                We currently don't have promotional items matching "{getCategoryTitle(selectedCategory)}". Try selecting another category or resetting your filters.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all"
              >
                Show All Offers
              </button>
            </div>
          )}
        </div>

        <NewsletterSection />
      </div>
    </div>
  );
};

export default OffersPage;
