import React from 'react';
import { Product } from '@/lib/data/types';
import { ModernProductCard } from './ModernProductCard';

interface ModernProductSectionProps {
  title: string;
  items: Product[];
}

export const ModernProductSection: React.FC<ModernProductSectionProps> = ({ title, items }) => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          {title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((product) => (
            <ModernProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
