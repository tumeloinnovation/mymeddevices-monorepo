'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Stethoscope, Home, Banknote, RotateCcw, Pill, Activity, Heart, Move3D, Droplet, Building, LucideIcon, Sliders, Sparkles, ArrowRight } from 'lucide-react';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {categories.map((category) => {
        const Icon = category.icon;
        const href = isBudget
          ? `/products${category.slug}`
          : `/categories/${category.slug}`;

        return (
          <Link
            key={category.name}
            href={href}
            className={cn(
              "group relative flex items-start gap-4 p-4 rounded-xl bg-card border border-border/80 hover:shadow-lg transition-all duration-200 text-left overflow-hidden",
              isBudget ? "hover:border-primary/50 hover:-translate-y-0.5" : "hover:border-primary/50"
            )}
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                  {category.name}
                </h3>
                {category.subtext && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                    {category.subtext}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{category.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

const BudgetInteractiveSection: React.FC = () => {
  const budgetChips = [
    { label: 'Under Ksh 500', desc: 'Syringes, bandages & basic supplies', href: '/products?min_price=0&max_price=500', tag: 'Micro' },
    { label: 'Ksh 500 - 1,000', desc: 'Test strips, masks & thermometers', href: '/products?min_price=500&max_price=1000', tag: 'Essentials' },
    { label: 'Ksh 1,000 - 2,500', desc: 'Pulse oximeters & basic BP cuffs', href: '/products?min_price=1000&max_price=2500', tag: 'Popular' },
    { label: 'Ksh 2,500 - 5,000', desc: 'Digital BP monitors & glucometers', href: '/products?min_price=2500&max_price=5000', tag: 'Value' },
    { label: 'Ksh 5,000 - 10,000', desc: 'Compressor nebulizers & dopplers', href: '/products?min_price=5000&max_price=10000', tag: 'Clinical' },
    { label: 'Ksh 10,000 - 25,000', desc: 'Transport wheelchairs & suction pumps', href: '/products?min_price=10000&max_price=25000', tag: 'Professional' },
    { label: 'Ksh 25,000+', desc: 'Oxygen concentrators & hospital beds', href: '/products?min_price=25000', tag: 'Advanced' },
  ];

  return (
    <div className="py-4 px-2">
      <div className="flex items-center justify-between mb-3 px-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Price Bracket</span>
        <span className="text-xs text-muted-foreground">Scroll to view more brackets →</span>
      </div>

      {/* Horizontal Price Chip Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 px-1 hide-scrollbar">
        {budgetChips.map((chip, idx) => (
          <Link
            key={idx}
            href={chip.href}
            className="group shrink-0 flex flex-col justify-between p-3.5 rounded-2xl bg-card border border-border/80 hover:border-primary/50 hover:shadow-md transition-all duration-200 w-52 text-left"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {chip.tag}
                </span>
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">→</span>
              </div>
              <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                {chip.label}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {chip.desc}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/60 text-[11px] font-semibold text-primary group-hover:underline">
              Browse products
            </div>
          </Link>
        ))}
      </div>
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
            <BudgetInteractiveSection />
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
