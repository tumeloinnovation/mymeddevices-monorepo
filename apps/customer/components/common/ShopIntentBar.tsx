'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Stethoscope, Home, Banknote, RotateCcw, Pill, Activity, Heart, Move3D, Droplet, Building, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

// Intent category mappings
const INTENT_CATEGORIES = {
  byCondition: [
    { name: 'Diabetes Care', slug: 'diabetic-care', icon: Droplet, description: 'Glucose monitors, test strips, lancets' },
    { name: 'Hypertension', slug: 'bp-monitors', icon: Activity, description: 'BP monitors, cuffs, accessories' },
    { name: 'Mobility Aids', slug: 'mobility-rehabilitation-aids', icon: Move3D, description: 'Wheelchairs, walkers, canes' },
    { name: 'Respiratory Care', slug: 'respiratory', icon: Activity, description: 'Nebulizers, oxygen equipment' },
    { name: 'Elderly Care', slug: 'elderly-care', icon: Heart, description: 'Daily living aids, safety equipment' },
    { name: 'First Aid', slug: 'first-aid', icon: Pill, description: 'Bandages, antiseptics, emergency kits' },
  ],
  byCareSetting: [
    { name: 'Home Care', slug: 'home-care', icon: Home, description: 'Equipment for home healthcare' },
    { name: 'Hospital Equipment', slug: 'hospital-equipment', icon: Building, description: 'Professional medical devices' },
    { name: 'Clinic Supplies', slug: 'clinic-supplies', icon: Stethoscope, description: 'Examination room essentials' },
    { name: 'Personal Care', slug: 'personal-care', icon: Heart, description: 'Personal health and wellness' },
  ],
  byBudget: [
    { name: 'Essentials', slug: '?min_price=0&max_price=1000', icon: Banknote, description: 'Under Ksh 1,000', subtext: 'Affordable basics' },
    { name: 'Everyday', slug: '?min_price=1000&max_price=5000', icon: Banknote, description: 'Ksh 1,000 - 5,000', subtext: 'Quality mid-range' },
    { name: 'Premium', slug: '?min_price=5000', icon: Banknote, description: 'Ksh 5,000+', subtext: 'Professional grade' },
  ],
};

interface CategoryItem {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
  subtext?: string;
}

interface IntentCategoryProps {
  categories: CategoryItem[];
  isBudget?: boolean;
}

const IntentCategory: React.FC<IntentCategoryProps> = ({ categories, isBudget = false }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
      {categories.map((category) => {
        const Icon = category.icon;
        const href = isBudget
          ? `/products${category.slug}`
          : `/categories/${category.slug}`;

        return (
          <Link
            key={category.name}
            href={href}
            className="group flex flex-col items-center p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
              {category.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
            {category.subtext && (
              <span className="text-[10px] text-muted-foreground/70 mt-1">{category.subtext}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export const ShopIntentBar: React.FC = () => {
  const [activeTab, setActiveTab] = useState('byCondition');

  return (
    <section className="bg-gradient-to-b from-background to-muted/20 border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-foreground">Shop by Intent</h2>
          <p className="text-sm text-muted-foreground">Find products based on your specific needs</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="byCondition" className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              <span>By Condition</span>
            </TabsTrigger>
            <TabsTrigger value="byCareSetting" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span>By Care Setting</span>
            </TabsTrigger>
            <TabsTrigger value="byBudget" className="flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              <span>By Budget</span>
            </TabsTrigger>
            <TabsTrigger value="quickReorder" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              <span>Quick Reorder</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="byCondition" className="mt-0">
            <IntentCategory categories={INTENT_CATEGORIES.byCondition} />
          </TabsContent>

          <TabsContent value="byCareSetting" className="mt-0">
            <IntentCategory categories={INTENT_CATEGORIES.byCareSetting} />
          </TabsContent>

          <TabsContent value="byBudget" className="mt-0">
            <IntentCategory categories={INTENT_CATEGORIES.byBudget} isBudget />
          </TabsContent>

          <TabsContent value="quickReorder" className="mt-0">
            <div className="p-8 text-center bg-card rounded-xl border border-border">
              <RotateCcw className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Quick Reorder</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sign in to quickly reorder your previously purchased products
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Sign In to Reorder
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default ShopIntentBar;
