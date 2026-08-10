import React from "react";
import { Tag, Flame, Stethoscope, Home, Layers } from "lucide-react";

interface OffersHeroSectionProps {
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

const OffersHeroSection: React.FC<OffersHeroSectionProps> = ({
  selectedCategory = "all",
  onSelectCategory,
}) => {
  const offerPills = [
    { id: "all", label: "All Offers", icon: Layers },
    { id: "limited-time", label: "Limited-Time", icon: Flame },
    { id: "care-team", label: "Clinic & Care Bundles", icon: Stethoscope },
    { id: "home-essentials", label: "Home Essentials", icon: Home },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 px-1 border-b border-border mb-6">
      <div className="text-left">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
          <Tag className="w-3.5 h-3.5" />
          <span>Promotions & Verified Deals</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Exclusive Medical Offers
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
          Browse certified medical devices with verified price drops across Kenya.
        </p>
      </div>

      {/* Quick-filter Category Pills directly in Header */}
      {onSelectCategory && (
        <div className="flex flex-wrap items-center gap-2">
          {offerPills.map((pill) => {
            const isActive = selectedCategory === pill.id;
            const Icon = pill.icon;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => onSelectCategory(pill.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border flex items-center gap-1.5 ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary-foreground" : "text-primary"}`} />
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OffersHeroSection;