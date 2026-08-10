'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ProductSection from './ProductSection';
import { useProducts } from '@/lib/hooks/useProducts';
import { ProductBadge } from './ProductBadge';
import Link from 'next/link';
import { Shield, Award } from 'lucide-react';
import { Product } from '@/lib/data/types';

interface ProductWithBadges {
  id: number | string;
  name: string;
  slug: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  on_sale?: boolean;
  featured?: boolean;
  average_rating?: string | number;
  rating_count?: number;
  short_description?: string;
  images?: Array<{ src: string; alt?: string }>;
  date_created?: string;
  stock_status?: string;
  badgeType?: 'top-rated' | 'best-value' | 'prescribed';
}

const CLINICIAN_BADGE_LABELS: Record<string, string> = {
  'top-rated': 'Top Rated',
  'best-value': 'Best Value',
  'prescribed': 'Most Prescribed',
};

export const CliniciansPicksSection: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('top-rated');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch products for each tab
  const topRatedProducts = useProducts({
    orderby: 'rating',
    per_page: 8,
  });

  const bestValueProducts = useProducts({
    on_sale: true,
    orderby: 'popularity',
    per_page: 8,
  });

  const prescribedProducts = useProducts({
    featured: true,
    orderby: 'popularity',
    per_page: 8,
  });

  const showLoading = !mounted;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Clinician&apos;s Picks</h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Hand-selected by our medical team for reliability, quality, and value. These products are trusted by healthcare professionals across Kenya.
            </p>
          </div>
          <Link
            href="/products?featured=true"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            See all
            <Shield className="w-4 h-4" />
          </Link>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="top-rated" className="flex items-center gap-2">
              <span>🔥</span>
              <span>Top Rated</span>
            </TabsTrigger>
            <TabsTrigger value="best-value" className="flex items-center gap-2">
              <span>⚡</span>
              <span>Best Value</span>
            </TabsTrigger>
            <TabsTrigger value="prescribed" className="flex items-center gap-2">
              <span>💎</span>
              <span>Most Prescribed</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top-rated" className="mt-0">
            <ProductSection
              title=""
              description="Highest rated products by healthcare professionals and customers"
              items={topRatedProducts.products || []}
              loading={showLoading || topRatedProducts.isLoading}
              emptyTitle="No Top Rated Products"
              emptyMessage="There are currently no top rated products listed in this section."
              layout="grid"
              gridClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            />
          </TabsContent>

          <TabsContent value="best-value" className="mt-0">
            <ProductSection
              title=""
              description="Best deals on quality medical equipment and supplies"
              items={bestValueProducts.products || []}
              loading={showLoading || bestValueProducts.isLoading}
              emptyTitle="No Best Value Deals"
              emptyMessage="There are currently no best value or discounted items available."
              layout="grid"
              gridClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            />
          </TabsContent>

          <TabsContent value="prescribed" className="mt-0">
            <ProductSection
              title=""
              description="Most recommended products by medical practitioners"
              items={prescribedProducts.products || []}
              loading={showLoading || prescribedProducts.isLoading}
              emptyTitle="No Prescribed Products Found"
              emptyMessage="There are currently no clinician-recommended products available."
              layout="grid"
              gridClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            />
          </TabsContent>
        </Tabs>

        {/* Mobile See All Link */}
        <div className="mt-4 sm:hidden text-center">
          <Link
            href="/products?featured=true"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            See all clinician&apos;s picks
            <Shield className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CliniciansPicksSection;
