"use client";

import React from 'react';
import Link from 'next/link';
import { useProducts } from '@/lib/hooks/useProducts';
import SectionHeader from '@/components/common/SectionHeader';
import { Building2 } from 'lucide-react';

const BrandsPage: React.FC = () => {
  const { products } = useProducts({ per_page: 100 });

  const brandsMap = new Map<string, { name: string; slug: string; count: number }>();

  products.forEach((product) => {
    const p = product as any;
    if (p.brands && p.brands.length > 0) {
      p.brands.forEach((brand: { id: number; name: string; slug: string }) => {
        if (!brandsMap.has(brand.slug)) {
          brandsMap.set(brand.slug, { name: brand.name, slug: brand.slug, count: 0 });
        }
        brandsMap.get(brand.slug)!.count += 1;
      });
    }
  });

  const brands = Array.from(brandsMap.values()).sort((a, b) => b.count - a.count);

  if (brands.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SectionHeader
          title="Shop By Brand"
          description="Browse medical devices by manufacturer"
        />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No brands available</h3>
          <p className="text-sm text-muted-foreground">
            Brands will appear here once products are added.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionHeader
        title="Shop By Brand"
        description="Browse medical devices by manufacturer"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={`/products?brand=${brand.slug}`}
            aria-label={`Browse ${brand.name} products`}
            className="group flex flex-col items-center text-center bg-card border border-border rounded-2xl p-6 transition-all duration-200 ease-in-out hover:shadow-lg hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center mb-4">
              <Building2 className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            <h3 className="font-semibold text-card-foreground text-base leading-tight mb-2">
              {brand.name}
            </h3>

            <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              {brand.count} {brand.count === 1 ? 'item' : 'items'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BrandsPage;
