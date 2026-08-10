import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Wallet,
  Settings,
  Bell,
  Store,
  Warehouse,
  Banknote,
  Image,
  LifeBuoy,
  Tag,
  Truck,
  PackageCheck,
  Ban,
  RefreshCw,
  CreditCard,
  Eye,
  Filter,
  Undo,
  RotateCcw,
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: number;
  children?: NavItem[];
  activePattern?: string;
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
      { href: "/vendor/inventory", icon: Warehouse, label: "Inventory" },
    ]
  },
  {
    section: "Orders",
    items: [
      {
        href: "/vendor/orders",
        icon: ShoppingCart,
        label: "All Orders",
        activePattern: "/vendor/orders",
        children: [
          { href: "/vendor/orders", icon: Eye, label: "All Orders" },
          { href: "/vendor/orders/pending", icon: Clock, label: "Pending" },
          { href: "/vendor/orders/paid", icon: CreditCard, label: "Paid" },
          { href: "/vendor/orders/processing", icon: Filter, label: "Processing" },
          { href: "/vendor/orders/shipped", icon: Truck, label: "Shipped" },
          { href: "/vendor/orders/delivered", icon: PackageCheck, label: "Delivered" },
          { href: "/vendor/orders/cancelled", icon: Ban, label: "Cancelled" },
          { href: "/vendor/orders/refunded", icon: RefreshCw, label: "Refunded" },
        ],
      },
      {
        href: "/vendor/returns",
        icon: Undo,
        label: "Returns",
        activePattern: "/vendor/returns",
        children: [
          { href: "/vendor/returns", icon: Eye, label: "All Returns" },
          { href: "/vendor/returns/pending", icon: Clock, label: "Pending" },
          { href: "/vendor/returns/approved", icon: CheckCircle2, label: "Approved" },
          { href: "/vendor/returns/rejected", icon: Ban, label: "Rejected" },
          { href: "/vendor/returns/completed", icon: PackageCheck, label: "Completed" },
        ],
      },
      {
        href: "/vendor/refunds",
        icon: RotateCcw,
        label: "Refunds",
        activePattern: "/vendor/refunds",
        children: [
          { href: "/vendor/refunds", icon: Eye, label: "All Refunds" },
          { href: "/vendor/refunds/pending", icon: Clock, label: "Pending" },
          { href: "/vendor/refunds/processing", icon: Filter, label: "Processing" },
          { href: "/vendor/refunds/completed", icon: CheckCircle2, label: "Completed" },
          { href: "/vendor/refunds/rejected", icon: Ban, label: "Rejected" },
        ],
      },
      { href: "/vendor/order-issues", icon: AlertTriangle, label: "Order Issues" },
      { href: "/vendor/disputes", icon: ClipboardList, label: "Disputes" },
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
      { href: "/vendor/settings/profile", icon: Store, label: "Store Profile" },
      { href: "/vendor/settings/security", icon: ShieldCheck, label: "Security & Password" },
      { href: "/vendor/settings/notifications", icon: Bell, label: "Notifications" },
      { href: "/vendor/support/tickets", icon: LifeBuoy, label: "Support Tickets" },
    ]
  },
];
