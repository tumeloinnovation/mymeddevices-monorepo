import React from "react";
import { Truck, RotateCcw, ShieldCheck, Award } from "lucide-react";

interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const features: FeatureItem[] = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders above KSh 5,000 across Kenya",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "Hassle-free 7-day return policy",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description: "M-Pesa, card & encrypted checkout",
  },
  {
    icon: Award,
    title: "Premium Quality",
    description: "100% certified genuine medical equipment",
  },
];

export const TrustFeaturesBar: React.FC = () => {
  return (
    <section className="py-4 md:py-6" aria-label="Store Guarantees">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug truncate sm:whitespace-normal">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TrustFeaturesBar;
