import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Layers,
  BarChart3,
  Wallet,
  Settings,
  HelpCircle,
  Bell,
  Store,
  Warehouse,
  Banknote,
  Image,
  LifeBuoy,
  Tag,
  Percent,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: number;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export const vendorNavSections: NavSection[] = [
  {
    section: "Overview",
    items: [
      { href: "/vendor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/vendor/analytics", icon: BarChart3, label: "Analytics" },
    ]
  },
  {
    section: "Catalog",
    items: [
      { href: "/vendor/products", icon: Package, label: "Products" },
      { href: "/vendor/media", icon: Image, label: "Media Library" },
    ]
  },
  {
    section: "Orders",
    items: [
      { href: "/vendor/orders", icon: ShoppingCart, label: "Orders" },
    ]
  },
  {
    section: "Inventory",
    items: [
      { href: "/vendor/inventory", icon: Warehouse, label: "Inventory" },
    ]
  },
  {
    section: "Finance",
    items: [
      { href: "/vendor/earnings", icon: Wallet, label: "Earnings" },
      { href: "/vendor/payouts", icon: Banknote, label: "Payouts" },
    ]
  },
    {
      section: "Marketing",
      items: [
        { href: "/vendor/coupons", icon: Tag, label: "Coupons" },
      ]
    },
    {
      section: "Settings",
      items: [
        { href: "/vendor/support/tickets", icon: LifeBuoy, label: "Support Tickets" },
        { href: "/vendor/settings/profile", icon: Store, label: "Store Profile" },
        { href: "/vendor/settings/notifications", icon: Bell, label: "Notifications" },
      ]
    },
];
