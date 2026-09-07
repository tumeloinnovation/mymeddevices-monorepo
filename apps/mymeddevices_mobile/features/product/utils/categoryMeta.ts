import { IconName } from "@/components/common/Icon";
import { Category } from "@/types/category";

interface CategoryMetaItem {
  imageUrl: string;
  iconName: IconName;
  subtitle: string;
}

/**
 * Curated high-resolution medical product images for child categories.
 * All images are verified, fast-loading, HTTPS CDN URLs with high uptime.
 */
export const CATEGORY_META_MAP: Record<string, CategoryMetaItem> = {
  // Diagnostic Devices
  "digital-thermometers": {
    imageUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
    iconName: "stethoscope",
    subtitle: "Fast, accurate body temp monitors",
  },
  "blood-pressure-monitors": {
    imageUrl:
      "https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=600&auto=format&fit=crop&q=80",
    iconName: "activity",
    subtitle: "Digital upper-arm & wrist monitors",
  },
  "blood-glucose-meters": {
    imageUrl:
      "https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=600&auto=format&fit=crop&q=80",
    iconName: "droplet",
    subtitle: "Glucometers & test strip kits",
  },
  "pulse-oximeters": {
    imageUrl:
      "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=600&auto=format&fit=crop&q=80",
    iconName: "heart",
    subtitle: "Fingertip SpO2 & pulse rate monitors",
  },
  "cholesterol-test-kits": {
    imageUrl:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80",
    iconName: "activity",
    subtitle: "Lipid & metabolic testing kits",
  },
  "digital-weighing-scales": {
    imageUrl:
      "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=600&auto=format&fit=crop&q=80",
    iconName: "scale",
    subtitle: "Precision body weight scales",
  },

  // Respiratory Care Devices
  "nebulizers": {
    imageUrl:
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80",
    iconName: "wind",
    subtitle: "Compressor & portable mesh nebulizers",
  },
  "cpap-bipap-machines": {
    imageUrl:
      "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80",
    iconName: "wind",
    subtitle: "Sleep apnea therapy & CPAP devices",
  },
  "portable-oxygen-concentrators": {
    imageUrl:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&auto=format&fit=crop&q=80",
    iconName: "wind",
    subtitle: "Continuous & pulse-flow oxygen units",
  },
  "steam-inhalers": {
    imageUrl:
      "https://images.unsplash.com/photo-1512290900672-1f4a9b6cfa43?w=600&auto=format&fit=crop&q=80",
    iconName: "wind",
    subtitle: "Warm mist sinus & respiratory care",
  },

  // Mobility & Rehabilitation Aids
  "wheelchairs": {
    imageUrl:
      "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=600&auto=format&fit=crop&q=80",
    iconName: "accessibility",
    subtitle: "Manual & electric folding wheelchairs",
  },
  "walkers-and-crutches": {
    imageUrl:
      "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80",
    iconName: "accessibility",
    subtitle: "Rollators, quad canes & crutches",
  },
  "knee-braces-wrist-supports": {
    imageUrl:
      "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&auto=format&fit=crop&q=80",
    iconName: "shield-check",
    subtitle: "Orthopedic joint braces & sleeves",
  },
  "hot-cold-therapy-packs": {
    imageUrl:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80",
    iconName: "heart",
    subtitle: "Reusable gel ice & heat therapy packs",
  },
  "tens-machines": {
    imageUrl:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80",
    iconName: "zap",
    subtitle: "Electrotherapy pulse pain relief",
  },

  // Personal Health & Wellness Devices
  "smart-fitness-bands-hr-monitors": {
    imageUrl:
      "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80",
    iconName: "watch",
    subtitle: "Activity & continuous HR trackers",
  },
  "body-composition-analyzers": {
    imageUrl:
      "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=600&auto=format&fit=crop&q=80",
    iconName: "pie-chart",
    subtitle: "Smart BMI & body fat analyzers",
  },
  "infrared-thermometers": {
    imageUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
    iconName: "stethoscope",
    subtitle: "No-contact forehead infrared scanners",
  },
  "sleep-trackers": {
    imageUrl:
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop&q=80",
    iconName: "moon",
    subtitle: "Rest & circadian rhythm monitors",
  },

  // Home Care & Patient Support
  "hospital-beds": {
    imageUrl:
      "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80",
    iconName: "bed",
    subtitle: "Adjustable manual & electric beds",
  },
  "suction-machines": {
    imageUrl:
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80",
    iconName: "package",
    subtitle: "Portable medical phlegm aspirators",
  },
  "air-mattresses-anti-bedsore": {
    imageUrl:
      "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=600&auto=format&fit=crop&q=80",
    iconName: "layers",
    subtitle: "Alternating pressure ripple mattresses",
  },
  "urine-bags-bedpans-commodes": {
    imageUrl:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&auto=format&fit=crop&q=80",
    iconName: "package",
    subtitle: "Bedside commodes & hygiene supplies",
  },

  // Wound & First Aid Care
  "first-aid-kits": {
    imageUrl:
      "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80",
    iconName: "shield-check",
    subtitle: "Emergency response first aid kits",
  },
  "bandages-and-dressings": {
    imageUrl:
      "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&auto=format&fit=crop&q=80",
    iconName: "shield-check",
    subtitle: "Sterile gauze & medical dressings",
  },
  "first-aid-digital-thermometers": {
    imageUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
    iconName: "stethoscope",
    subtitle: "Fast clinical fever thermometers",
  },
  "burn-relief-gels": {
    imageUrl:
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80",
    iconName: "zap",
    subtitle: "Cooling burn dressings & hydrogels",
  },
  "hot-cold-compresses": {
    imageUrl:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80",
    iconName: "heart",
    subtitle: "Instant squeeze cold/hot compresses",
  },

  // Maternal & Child Health
  "fetal-dopplers": {
    imageUrl:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80",
    iconName: "heart",
    subtitle: "Prenatal baby heartbeat monitors",
  },
  "baby-thermometers": {
    imageUrl:
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80",
    iconName: "baby",
    subtitle: "Gentle infant & pacifier thermometers",
  },
  "electric-breast-pumps": {
    imageUrl:
      "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&auto=format&fit=crop&q=80",
    iconName: "sparkles",
    subtitle: "Hands-free & double electric pumps",
  },
  "baby-weighing-scales": {
    imageUrl:
      "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=600&auto=format&fit=crop&q=80",
    iconName: "baby",
    subtitle: "Digital curved infant weighing scales",
  },
  "bottle-sterilizers": {
    imageUrl:
      "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&auto=format&fit=crop&q=80",
    iconName: "shield-check",
    subtitle: "Electric steam & UV bottle sterilizers",
  },
};

/**
 * Resolves the best image URL for a category, checking direct attributes
 * then matching slug or name against the curated dictionary.
 */
export const getCategoryImageUrl = (category?: Partial<Category> | null): string => {
  if (!category) {
    return "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80";
  }

  // 1. Direct image property
  if (category.image?.src && category.image.src.startsWith("http")) {
    return category.image.src;
  }

  // 2. Direct icon_url if it's an HTTP URL
  if (category.icon_url && category.icon_url.startsWith("http")) {
    return category.icon_url;
  }

  // 3. Match by exact slug
  const slug = (category.slug || "").toLowerCase().trim();
  if (slug && CATEGORY_META_MAP[slug]) {
    return CATEGORY_META_MAP[slug].imageUrl;
  }

  // 4. Match by slug substrings / keywords
  const name = (category.name || "").toLowerCase().trim();
  const searchKey = `${slug} ${name}`;

  if (searchKey.includes("pressure") || searchKey.includes("sphygmo")) {
    return CATEGORY_META_MAP["blood-pressure-monitors"].imageUrl;
  }
  if (searchKey.includes("glucose") || searchKey.includes("diabet") || searchKey.includes("glucometer")) {
    return CATEGORY_META_MAP["blood-glucose-meters"].imageUrl;
  }
  if (searchKey.includes("oximeter") || searchKey.includes("pulse") || searchKey.includes("spo2")) {
    return CATEGORY_META_MAP["pulse-oximeters"].imageUrl;
  }
  if (searchKey.includes("baby") || searchKey.includes("infant") || searchKey.includes("pediatric")) {
    return CATEGORY_META_MAP["baby-thermometers"].imageUrl;
  }
  if (searchKey.includes("thermometer") || searchKey.includes("fever") || searchKey.includes("temp")) {
    return CATEGORY_META_MAP["digital-thermometers"].imageUrl;
  }
  if (searchKey.includes("wheelchair") || searchKey.includes("mobility")) {
    return CATEGORY_META_MAP["wheelchairs"].imageUrl;
  }
  if (searchKey.includes("nebulizer") || searchKey.includes("inhaler") || searchKey.includes("respiratory")) {
    return CATEGORY_META_MAP["nebulizers"].imageUrl;
  }
  if (searchKey.includes("oxygen") || searchKey.includes("cpap")) {
    return CATEGORY_META_MAP["portable-oxygen-concentrators"].imageUrl;
  }
  if (searchKey.includes("scale") || searchKey.includes("weigh")) {
    return CATEGORY_META_MAP["digital-weighing-scales"].imageUrl;
  }
  if (searchKey.includes("breast") || searchKey.includes("pump") || searchKey.includes("lactation")) {
    return CATEGORY_META_MAP["electric-breast-pumps"].imageUrl;
  }
  if (searchKey.includes("bed") || searchKey.includes("mattress")) {
    return CATEGORY_META_MAP["hospital-beds"].imageUrl;
  }
  if (searchKey.includes("first aid") || searchKey.includes("kit") || searchKey.includes("emergency")) {
    return CATEGORY_META_MAP["first-aid-kits"].imageUrl;
  }
  if (searchKey.includes("bandage") || searchKey.includes("dressing") || searchKey.includes("wound")) {
    return CATEGORY_META_MAP["bandages-and-dressings"].imageUrl;
  }
  if (searchKey.includes("brace") || searchKey.includes("support") || searchKey.includes("orthopedic")) {
    return CATEGORY_META_MAP["knee-braces-wrist-supports"].imageUrl;
  }
  if (searchKey.includes("fitness") || searchKey.includes("watch") || searchKey.includes("band") || searchKey.includes("track")) {
    return CATEGORY_META_MAP["smart-fitness-bands-hr-monitors"].imageUrl;
  }

  // Default Medical Device Image
  return "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80";
};

/**
 * Returns category subtitle / description for rich card displays.
 */
export const getCategorySubtitle = (category?: Partial<Category> | null): string => {
  if (!category) return "Certified medical equipment";
  if (category.description && category.description.trim().length > 0) {
    return category.description;
  }
  const slug = (category.slug || "").toLowerCase().trim();
  if (slug && CATEGORY_META_MAP[slug]) {
    return CATEGORY_META_MAP[slug].subtitle;
  }
  return "Certified healthcare device";
};
