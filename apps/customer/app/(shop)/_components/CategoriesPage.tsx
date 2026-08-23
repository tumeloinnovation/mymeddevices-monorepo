// app/(shop)/_components/CategoriesPage.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCategories } from '@/lib/hooks/useCategories';
import SectionHeader from '@/components/common/SectionHeader';

const CategoriesPage: React.FC = () => {
  const { data: categories = [] } = useCategories();

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionHeader
        title="Shop By Categories"
        description="Browse all our product categories"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            aria-label={`Browse ${category.name} products`}
            className="group flex flex-col items-center text-center bg-card border border-border rounded-2xl p-6 transition-all duration-200 ease-in-out hover:shadow-lg hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex items-center justify-center mb-4">
              <Image
                src={category.image?.src || '/logos/logo-portrait.png'}
                alt={category.name}
                width={96}
                height={96}
                className="object-contain"
              />
            </div>

            <h3 className="font-semibold text-card-foreground text-base leading-tight mb-2">
              {category.name}
            </h3>

            <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              {category.count ?? 0} {(category.count ?? 0) === 1 ? 'item' : 'items'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoriesPage;