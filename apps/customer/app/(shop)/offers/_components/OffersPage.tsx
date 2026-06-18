"use client";

import React, { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const getCategoryDescription = (category: string) => {
  switch (category) {
    case "limited-time": return "Exclusive deals on home-use medical devices like blood pressure monitors and wheelchairs";
    case "care-team": return "Bulk discounts and professional bundles for clinics and healthcare facilities";
    case "home-essentials": return "Essential medical equipment with shipping perks and extended warranties";
    default: return "Discover our current promotions and special offers";
  }
};

const OffersPage: React.FC = () => {
  const { data: saleProducts = [], isLoading, isError, error } = useOnSaleProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");

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

  const filteredAndSortedOffers = useMemo(() => {
    let filtered = saleProducts;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((offer) =>
        offer.tags.some((tag) => tag.slug === selectedCategory)
      );
    }

    const sorted = [...filtered];
    if (sortBy === "discount-high") {
      sorted.sort((a, b) => {
        const aDiscount = a.sale_price
          ? ((Number(a.regular_price) - Number(a.sale_price)) / Number(a.regular_price)) * 100
          : 0;
        const bDiscount = b.sale_price
          ? ((Number(b.regular_price) - Number(b.sale_price)) / Number(b.regular_price)) * 100
          : 0;
        return bDiscount - aDiscount;
      });
    } else if (sortBy === "price-low") {
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-high") {
      sorted.sort((a, b) => Number(b.price) - Number(a.price));
    }
    return sorted;
  }, [saleProducts, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto text-center px-4">
        <OffersHeroSection />

        {/* Filter/Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">Filter by:</span>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Offer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Offers</SelectItem>
                <SelectItem value="limited-time">Limited-Time</SelectItem>
                <SelectItem value="care-team">Care Team</SelectItem>
                <SelectItem value="home-essentials">Home Essentials</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort options" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="discount-high">Highest Discount</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Offers Grid */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {getCategoryTitle(selectedCategory)}
            </h2>
            <p className="text-muted-foreground">
              {getCategoryDescription(selectedCategory)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {filteredAndSortedOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>

          {!filteredAndSortedOffers.length && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No offers available in this category.
              </p>
            </div>
          )}
        </div>

        <NewsletterSection />
      </div>
    </div>
  );
};

export default OffersPage;
