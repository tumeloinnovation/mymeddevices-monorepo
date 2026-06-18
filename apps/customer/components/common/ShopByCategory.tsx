import React from 'react';
import Image from 'next/image';
import SectionHeader from './SectionHeader';
import Link from 'next/link';
import { useCategories } from '@/lib/hooks/useCategories';
import { FolderOpen } from 'lucide-react';

export const ShopByCategories: React.FC = () => {
  const { data: categories = [], isLoading, error } = useCategories();

  return (
    <section className="bg-background sm:py-12">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="Shop By Categories"
          description="Check out all the feature categories for simple product discovery."
        />

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 h-40 animate-pulse" />
            ))}
          </div>
        ) : error || !Array.isArray(categories) || categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="w-14 h-14 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground mb-1">
              {error ? "Failed to load categories" : "No categories available"}
            </p>
            {!error && <p className="text-xs text-muted-foreground/70">Check back soon as we update our catalog</p>}
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {categories.slice(0, 10).map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              aria-label={`Browse ${category.name} products`}
              className="group flex flex-col items-center text-center bg-card border border-border rounded-2xl p-4 transition-shadow duration-200 ease-in-out hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center mb-3">
                <Image
                  src={category.image?.src || '/logos/logo-portrait.png'}
                  alt={category.name}
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>

              <h3 className="font-medium text-card-foreground text-sm sm:text-base leading-tight">
                {category.name}
              </h3>

              <span className="mt-2 text-[12px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">{category.count} items</span>
            </Link>
          ))}
        </div>
        )}
      </div>
    </section>
  );
};
