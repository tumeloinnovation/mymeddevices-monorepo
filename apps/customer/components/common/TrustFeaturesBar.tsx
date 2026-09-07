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
    title: "Countrywide Delivery",
    description: "Doorstep delivery across Nairobi and all 47 counties",
  },
  {
    icon: RotateCcw,
    title: "Easy 7-Day Returns",
    description: "Simple, hassle-free replacement or refund policy",
  },
  {
    icon: ShieldCheck,
    title: "Lipa na M-Pesa",
    description: "Pay safely & instantly via M-Pesa or card",
  },
  {
    icon: Award,
    title: "100% Genuine Devices",
    description: "Certified medical equipment with manufacturer warranty",
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
