"use client"

import { useAuthStore, AuthGuard, useAuthCookie, getUserDisplayName, type UserRole } from "@mymeddevices/shared-core"
import { SidebarLogo } from "./logo"
import { SidebarProvider } from "./ui/sidebar"
import {
  LayoutDashboardIcon,
  UsersIcon,
  CogIcon,
  SettingsIcon,
  PackageIcon,
  PackageCheckIcon,
  ShoppingCartIcon,
  TagIcon,
  BarChart3Icon,
  StoreIcon,
  FileTextIcon,
  FileCheckIcon,
  CreditCardIcon,
  TruckIcon,
  AlertCircleIcon,
  XCircleIcon,
  LogOutIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ChevronRightIcon,
  MessageSquareIcon,
  FolderTreeIcon,
  TrendingUpIcon,
  HeadphonesIcon,
  HelpCircleIcon,
  FileEditIcon,
  GitBranchIcon,
  ShieldIcon,
  ShieldCheckIcon,
  ActivityIcon,
  HeartIcon,
  MapPinIcon,
  MapIcon,
  BuildingIcon,
  GlobeIcon,
  ClockIcon,
  SearchIcon,
  LockIcon,
  EyeIcon,
  KeyIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SparklesIcon,
  UserCogIcon,
  HomeIcon,
  XIcon,
  UploadIcon,
  UndoIcon,
  MegaphoneIcon,
  GiftIcon,
  ImageIcon,
  MailIcon,
  DollarSignIcon,
  ReceiptIcon,
  PercentIcon,
  WalletIcon,
  PieChartIcon,
  LineChartIcon,
  Users2Icon,
  PackageSearchIcon,
  BoxesIcon,
  ShipIcon,
  WrenchIcon,
  BarcodeIcon,
  PrinterIcon,
  WarehouseIcon,
  Globe2Icon,
  MousePointerClickIcon,
  FilterIcon,
  FileBarChartIcon,
  TrendingDownIcon,
  ArrowUpDownIcon,
  CopyIcon,
  RefreshCwIcon,
  type LucideIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import React, { useEffect, useState, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"

export type DashboardTheme = "admin" | "vendor" | "customer"

export type NavItem = {
  label: string
  href: string
  icon?: LucideIcon
  target?: string
  children?: NavItem[]
  isCollapsible?: boolean
}

export type NavGroup = {
  label: string
  icon?: LucideIcon
  items: NavItem[]
}

export type NavConfig = NavGroup[]

interface DashboardLayoutProps {
  children: React.ReactNode
  theme?: DashboardTheme
  navConfig?: NavConfig
}

const DEFAULT_NAV_CONFIG: Record<DashboardTheme, NavConfig> = {
  admin: [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PRIMARY DASHBOARD
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      label: "Overview",
      icon: LayoutDashboardIcon,
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
      ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CATALOG MANAGEMENT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      label: "Catalog",
      icon: PackageIcon,
      items: [
        { label: "Products", href: "/dashboard/catalog/products", icon: PackageIcon },
        { label: "Categories", href: "/dashboard/catalog/categories", icon: FolderTreeIcon },
        { label: "Brands", href: "/dashboard/catalog/brands", icon: TagIcon },
        { label: "Tags", href: "/dashboard/catalog/tags", icon: TagIcon },
        { label: "Reviews", href: "/dashboard/catalog/reviews", icon: MessageSquareIcon },
      ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ORDER MANAGEMENT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      label: "Orders",
      icon: ShoppingCartIcon,
      items: [
        { label: "All Orders", href: "/dashboard/orders", icon: ShoppingCartIcon },
        { label: "Order Statuses", href: "/dashboard/orders/statuses", icon: GitBranchIcon },
        { label: "Returns", href: "/dashboard/orders/returns", icon: UndoIcon },
        { label: "Refunds", href: "/dashboard/orders/refunds", icon: CreditCardIcon },
        { label: "Abandoned Carts", href: "/dashboard/shopping/abandoned-carts", icon: XIcon },
      ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CUSTOMER & VENDOR MANAGEMENT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      label: "Users",
      icon: UsersIcon,
      items: [
        { label: "User Management", href: "/dashboard/users", icon: ShieldCheckIcon },
        { label: "Customers", href: "/dashboard/users/customers", icon: UsersIcon },
        { label: "Vendors", href: "/dashboard/vendors", icon: StoreIcon },
        { label: "Staff & Admins", href: "/dashboard/users/staff", icon: UserCogIcon },
      ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MARKETING & PROMOTIONS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      label: "Marketing",
      icon: MegaphoneIcon,
      items: [
        { label: "Coupons", href: "/dashboard/marketing/coupons", icon: TagIcon },
        { label: "Banners", href: "/dashboard/marketing/banners", icon: ImageIcon },
        { label: "Email Campaigns", href: "/dashboard/marketing/email-campaigns", icon: MailIcon },
        { label: "SMS Marketing", href: "/dashboard/marketing/sms", icon: MessageSquareIcon },
        { label: "Flash Sales", href: "/dashboard/marketing/flash-sales", icon: ClockIcon },
        { label: "Product Promotions", href: "/dashboard/marketing/promotions", icon: PercentIcon },
        { label: "Bundle Deals", href: "/dashboard/marketing/bundles", icon: PackageIcon },
        { label: "Free Shipping", href: "/dashboard/marketing/free-shipping", icon: TruckIcon },
      ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FINANCIAL MANAGEMENT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      label: "Financial",
      icon: CreditCardIcon,
      items: [
        { label: "Transactions", href: "/dashboard/payments", icon: CreditCardIcon },
        { label: "Transaction History", href: "/dashboard/payments/transaction-history", icon: FileTextIcon },
        { label: "Payment Methods", href: "/dashboard/payments/payment-methods", icon: WalletIcon },
        { label: "Refund Management", href: "/dashboard/payments/refund-management", icon: RefreshCwIcon },
        { label: "Payment Analytics", href: "/dashboard/payments/payment-analytics", icon: PieChartIcon },
        { label: "Invoices", href: "/dashboard/financial/invoices", icon: ReceiptIcon },
        { label: "Revenue Reports", href: "/dashboard/financial/revenue", icon: TrendingUpIcon },
        { label: "Tax Reports", href: "/dashboard/financial/tax", icon: PercentIcon },
        { label: "Vendor Payouts", href: "/dashboard/financial/payouts", icon: DollarSignIcon },
      ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SHIPPING & LOGISTICS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      label: "Shipping",
      icon: TruckIcon,
      items: [
        { label: "Delivery Tracking", href: "/dashboard/shipping", icon: TruckIcon },
        { label: "Nairobi Rates", href: "/dashboard/shipping/nairobi-rates", icon: MapIcon },
        { label: "County Zones", href: "/dashboard/shipping/zones", icon: MapIcon },
        { label: "Carriers", href: "/dashboard/shipping/carriers", icon: ShipIcon },
        { label: "Shipping Labels", href: "/dashboard/shipping/labels", icon: PrinterIcon },
      ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ANALYTICS & REPORTS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      label: "Analytics",
      icon: BarChart3Icon,
      items: [
        { label: "Overview", href: "/dashboard/shopping/analytics", icon: BarChart3Icon },
        { label: "Sales Reports", href: "/dashboard/analytics/sales", icon: LineChartIcon },
        { label: "Product Analytics", href: "/dashboard/analytics/products", icon: PackageSearchIcon },
        { label: "Customer Analytics", href: "/dashboard/analytics/customers", icon: Users2Icon },
        { label: "Vendor Performance", href: "/dashboard/analytics/vendors", icon: StoreIcon },
        { label: "Traffic & Conversion", href: "/dashboard/analytics/traffic", icon: MousePointerClickIcon },
        { label: "Inventory Reports", href: "/dashboard/analytics/inventory", icon: BoxesIcon },
      ],
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SYSTEM SETTINGS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      label: "Settings",
      icon: SettingsIcon,
      items: [
        { label: "General", href: "/settings/general", icon: SettingsIcon },
        { label: "Account & Security", href: "/settings", icon: ShieldIcon },
        { label: "Roles & Permissions", href: "/dashboard/settings/permissions", icon: ShieldCheckIcon },
        { label: "Notifications", href: "/settings/notifications", icon: BellIcon },
        { label: "Shipping Logistics", href: "/settings/shipping", icon: TruckIcon },
        { label: "Payment Gateway", href: "/settings/payments", icon: CreditCardIcon },
        { label: "Email & SMS", href: "/settings/communications", icon: MailIcon },
        { label: "Localization", href: "/settings/localization", icon: GlobeIcon },
        { label: "System Health", href: "/system", icon: ActivityIcon },
        { label: "Rate Limiting", href: "/settings/rate-limits", icon: FilterIcon },
        { label: "API & Integrations", href: "/settings/integrations", icon: KeyIcon },
        { label: "Maintenance", href: "/settings/maintenance", icon: WrenchIcon },
      ],
    },
  ],
  vendor: [
    {
      label: "Overview",
      icon: LayoutDashboardIcon,
      items: [
        { label: "Dashboard", href: "/vendor/dashboard", icon: LayoutDashboardIcon },
        { label: "Analytics", href: "/vendor/analytics", icon: BarChart3Icon },
      ],
    },
    {
      label: "Store Management",
      icon: StoreIcon,
      items: [
        { label: "Customer Orders", href: "/vendor/orders", icon: ShoppingCartIcon },
        { label: "Products Catalog", href: "/vendor/products", icon: PackageIcon },
        { label: "Inventory Stock", href: "/vendor/inventory", icon: StoreIcon },
      ],
    },
    {
      label: "Financials",
      icon: CreditCardIcon,
      items: [
        { label: "Earnings & Payouts", href: "/vendor/earnings", icon: CreditCardIcon },
      ],
    },
    {
      label: "Marketing",
      icon: TagIcon,
      items: [
        { label: "Coupons & Promos", href: "/vendor/coupons", icon: TagIcon },
      ],
    },
    {
      label: "System & Support",
      icon: HeadphonesIcon,
      items: [
        { label: "Store Settings", href: "/vendor/settings/profile", icon: SettingsIcon },
        { label: "Support Tickets", href: "/vendor/support/tickets", icon: HeadphonesIcon },
      ],
    },
  ],
  customer: [
    {
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
      ],
    },
    {
      label: "My Account",
      icon: UsersIcon,
      items: [
        { label: "Profile", href: "/dashboard/profile", icon: UsersIcon },
        { label: "Payment Methods", href: "/dashboard/payment-methods", icon: CreditCardIcon },
        { label: "Addresses", href: "/dashboard/addresses", icon: MapPinIcon },
        { label: "Communication", href: "/dashboard/communication", icon: BellIcon },
      ],
    },
    {
      label: "My Orders",
      icon: ShoppingCartIcon,
      items: [
        { label: "Orders", href: "/dashboard/orders", icon: ShoppingCartIcon },
        { label: "Returns", href: "/dashboard/returns", icon: AlertCircleIcon },
        { label: "Order Tracking", href: "/dashboard/tracking", icon: TruckIcon },
      ],
    },
    {
      label: "My Stuff",
      icon: HeartIcon,
      items: [
        { label: "Wishlist", href: "/dashboard/wishlist", icon: HeartIcon },
        { label: "Product Reviews", href: "/dashboard/reviews", icon: MessageSquareIcon },
        { label: "Recently Viewed", href: "/dashboard/recently-viewed", icon: ClockIcon },
        { label: "Saved Searches", href: "/dashboard/saved-searches", icon: SearchIcon },
      ],
    },
    {
      label: "Medical",
      icon: FileTextIcon,
      items: [
        { label: "Prescriptions", href: "/dashboard/prescriptions", icon: FileTextIcon },
        { label: "Insurance", href: "/dashboard/insurance", icon: ShieldIcon },
      ],
    },
    {
      label: "Settings",
      icon: SettingsIcon,
      items: [
        { label: "Preferences", href: "/dashboard/preferences", icon: SettingsIcon },
        { label: "Security", href: "/dashboard/security", icon: LockIcon },
        { label: "Privacy", href: "/dashboard/privacy", icon: EyeIcon },
      ],
    },
  ],
}

const THEME_ACCENTS: Record<DashboardTheme, { activeBg: string; activeText: string; activeBorder: string; badgeBg: string; badgeText: string }> = {
  admin: {
    activeBg: "bg-blue-600",
    activeText: "text-blue-600 dark:text-blue-400",
    activeBorder: "border-blue-600 dark:border-blue-500",
    badgeBg: "bg-blue-500/10 dark:bg-blue-500/20",
    badgeText: "text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  vendor: {
    activeBg: "bg-orange-600",
    activeText: "text-orange-600 dark:text-orange-400",
    activeBorder: "border-orange-600 dark:border-orange-500",
    badgeBg: "bg-orange-500/10 dark:bg-orange-500/20",
    badgeText: "text-orange-600 dark:text-orange-400 border-orange-500/30",
  },
  customer: {
    activeBg: "bg-emerald-600",
    activeText: "text-emerald-600 dark:text-emerald-400",
    activeBorder: "border-emerald-600 dark:border-emerald-500",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeText: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
}

const ALLOWED_ROLES: Record<DashboardTheme, UserRole[]> = {
  admin: ["admin", "worker"],
  vendor: ["vendor"],
  customer: ["customer"],
}

const DEFAULT_INITIALS: Record<DashboardTheme, string> = {
  admin: "AD",
  vendor: "VN",
  customer: "CU",
}

const DEFAULT_USER_LABEL: Record<DashboardTheme, string> = {
  admin: "System Admin",
  vendor: "Certified Vendor",
  customer: "Customer",
}

function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">("dark")

  useEffect(() => {
    const stored = localStorage.getItem("theme")
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark")
      setThemeState("dark")
    } else {
      document.documentElement.classList.remove("dark")
      setThemeState("light")
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light"
    if (next === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("theme", next)
    setThemeState(next)
  }

  return { theme, toggleTheme }
}

function SubHeaderBreadcrumbs({ theme, currentCategory, currentPage }: { theme: DashboardTheme; currentCategory: string; currentPage: string }) {
  const pathname = usePathname()
  const dashboardHref = theme === "vendor" ? "/vendor/dashboard" : "/dashboard"

  return (
    <div className="flex h-10 w-full items-center justify-between border-b border-border bg-card/40 px-6 text-xs shrink-0">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-muted-foreground">
        <Link href={dashboardHref} className="flex items-center gap-1 hover:text-foreground transition-colors">
          <HomeIcon className="size-3.5" />
          <span>Dashboard</span>
        </Link>
        <ChevronRightIcon className="size-3 text-muted-foreground/60" />
        <span className="font-medium text-foreground/80">{currentCategory}</span>
        <ChevronRightIcon className="size-3 text-muted-foreground/60" />
        <span className={cn("font-semibold", THEME_ACCENTS[theme].activeText)}>{currentPage}</span>
      </nav>

      <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>System Status:</span>
        <span className="inline-flex items-center gap-1 font-medium text-emerald-500">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Data
        </span>
      </div>
    </div>
  )
}

function ProfilePopoverMenu({ theme }: { theme: DashboardTheme }) {
  const { user, logout, isLoading } = useAuthStore()
  const { clearAuthCookie } = useAuthCookie()
  const router = useRouter()

  const displayName = getUserDisplayName(user)
  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || user?.email?.[0]?.toUpperCase() || DEFAULT_INITIALS[theme]

  const handleLogout = async () => {
    if (process.env.NODE_ENV === "development") {
      sessionStorage.setItem("dev_logged_out", "true")
    }
    await logout()
    clearAuthCookie()
    router.push("/login")
  }

  const profileHref = theme === "vendor" ? "/vendor/settings/profile" : "/settings"
  const accents = THEME_ACCENTS[theme]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground font-bold text-xs shadow-md transition-all hover:ring-2 hover:ring-primary/50 focus:outline-none"
          title="User Profile & Settings"
        >
          <span>{initials}</span>
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="end"
        sideOffset={12}
        className="w-64 rounded-2xl p-2 shadow-2xl bg-popover/95 backdrop-blur-md border border-border z-50"
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 p-3 border-b border-border bg-muted/30 rounded-xl">
            <Avatar className="h-10 w-10 rounded-xl">
              <AvatarFallback className="rounded-xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
              <span className="truncate font-bold text-foreground text-sm">{displayName || DEFAULT_USER_LABEL[theme]}</span>
              <span className="truncate text-muted-foreground">{user?.email || "user@mymeddevices.com"}</span>
              <span className={cn("inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold border border-current uppercase tracking-wider w-max", accents.badgeBg, accents.badgeText)}>
                {user?.role || DEFAULT_USER_LABEL[theme]}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <div className="py-1 space-y-0.5">
          <DropdownMenuItem asChild>
            <Link
              href={profileHref}
              className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg cursor-pointer text-amber-500 font-medium hover:bg-amber-500/10 transition-colors"
            >
              <SparklesIcon className="size-4" />
              <span>Upgrade to Pro</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href={profileHref} className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg cursor-pointer">
              <UserCogIcon className="size-4 text-muted-foreground" />
              <span>Account Settings</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/dashboard/financial/invoices" className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg cursor-pointer">
              <CreditCardIcon className="size-4 text-muted-foreground" />
              <span>Billing & Subscriptions</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/dashboard/support/tickets" className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg cursor-pointer justify-between">
              <div className="flex items-center gap-2.5">
                <BellIcon className="size-4 text-muted-foreground" />
                <span>Notifications</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">3</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <LogOutIcon className="size-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function DashboardLayout({
  children,
  theme = "admin",
  navConfig,
}: DashboardLayoutProps) {
  const config = navConfig || DEFAULT_NAV_CONFIG[theme]
  const allowedRoles = ALLOWED_ROLES[theme]
  const accents = THEME_ACCENTS[theme]

  const pathname = usePathname()
  const router = useRouter()
  const { theme: mode, toggleTheme } = useTheme()

  const [activeGroupIndex, setActiveGroupIndex] = useState(0)
  const [isSubpanelOpen, setIsSubpanelOpen] = useState(true)
  const [filterQuery, setFilterQuery] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Find active group & page label based on current pathname
  const activeMatch = useMemo(() => {
    // Handle order status pages: /dashboard/orders/by-status/{status}
    const orderStatusMatch = pathname.match(/\/dashboard\/orders\/by-status\/(\w+)/)
    if (orderStatusMatch) {
      const status = orderStatusMatch[1]
      const pageLabel = status.charAt(0).toUpperCase() + status.slice(1)
      const ordersGroupIdx = config.findIndex((g) => g.items.some((i) => i.href.includes("/orders")))
      return { groupIdx: ordersGroupIdx !== -1 ? ordersGroupIdx : 0, pageLabel }
    }

    // 1. Exact match first across all groups
    for (let gIdx = 0; gIdx < config.length; gIdx++) {
      const exactItem = config[gIdx].items.find((i) => i.href === pathname)
      if (exactItem) {
        return { groupIdx: gIdx, pageLabel: exactItem.label }
      }
    }

    // 2. Prefix match (prefer longest matching href)
    let bestMatch: { groupIdx: number; pageLabel: string; matchLength: number } | null = null
    for (let gIdx = 0; gIdx < config.length; gIdx++) {
      for (const item of config[gIdx].items) {
        if (item.href !== "/dashboard" && item.href !== "/settings" && pathname.startsWith(item.href + "/")) {
          if (!bestMatch || item.href.length > bestMatch.matchLength) {
            bestMatch = { groupIdx: gIdx, pageLabel: item.label, matchLength: item.href.length }
          }
        }
      }
    }

    if (bestMatch) {
      return { groupIdx: bestMatch.groupIdx, pageLabel: bestMatch.pageLabel }
    }

    return { groupIdx: 0, pageLabel: "Dashboard" }
  }, [pathname, config])

  useEffect(() => {
    setActiveGroupIndex(activeMatch.groupIdx)
  }, [activeMatch.groupIdx])

  // Automatically close sidebar subpanel when navigating to another page
  useEffect(() => {
    setIsSubpanelOpen(false)
  }, [pathname])

  const activeGroup = config[activeGroupIndex] || config[0]
  const currentPage = activeMatch.pageLabel

  // Filter items in active group based on input
  const filteredItems = useMemo(() => {
    if (!filterQuery.trim()) return activeGroup.items
    const q = filterQuery.toLowerCase()
    return activeGroup.items.filter((item) => item.label.toLowerCase().includes(q))
  }, [activeGroup, filterQuery])

  // Keyboard shortcut to focus global search (/)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !event.ctrlKey && !event.metaKey) {
        const active = document.activeElement
        const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
        if (!isInput) {
          event.preventDefault()
          searchInputRef.current?.focus()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <TooltipProvider>
        <SidebarProvider>
          <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">

            {/* RAIL 1: PRIMARY ICON BAR (64px) */}
            <aside className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center justify-between py-4 shrink-0 z-20">
              <div className="flex flex-col items-center gap-5 w-full">
                {/* Brand Logo */}
                <Link href={theme === "vendor" ? "/vendor/dashboard" : "/dashboard"} className="flex items-center justify-center">
                  <SidebarLogo theme={theme} isCollapsed={true} />
                </Link>

                <Separator className="w-8 bg-sidebar-border" />

                {/* Navigation Categories */}
                <nav className="flex flex-col gap-2 w-full px-2">
                  {config.map((group, idx) => {
                    const GroupIcon = group.icon || LayoutDashboardIcon
                    const isActive = idx === activeGroupIndex

                    return (
                      <Tooltip key={group.label} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              setActiveGroupIndex(idx)
                              if (!isSubpanelOpen) setIsSubpanelOpen(true)
                            }}
                            className={cn(
                              "relative flex size-10 items-center justify-center rounded-xl transition-all duration-200",
                              isActive
                                ? cn(accents.activeBg, "text-white shadow-md shadow-primary/20")
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            )}
                          >
                            <GroupIcon className="size-5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          {group.label}
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </nav>
              </div>

              {/* Rail Bottom Controls */}
              <div className="flex flex-col items-center gap-3 w-full px-2">
                <Separator className="w-8 bg-sidebar-border" />
                <ProfilePopoverMenu theme={theme} />
              </div>
            </aside>

            {/* RAIL 2: SECONDARY SUBMENU PANEL (240px width transition to 0px) */}
            <aside
              className={cn(
                "bg-sidebar/95 flex flex-col shrink-0 transition-all duration-300 ease-in-out z-10 overflow-hidden",
                isSubpanelOpen
                  ? "w-60 opacity-100 border-r border-sidebar-border"
                  : "w-0 opacity-0 pointer-events-none border-r-0"
              )}
            >
              <div className="w-60 flex flex-col h-full shrink-0">
                {/* Submenu Header */}
                <div className="h-14 border-b border-sidebar-border px-4 flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-sidebar-foreground/70 truncate">
                    {activeGroup.label}
                  </span>
                  <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider shrink-0", accents.badgeBg, accents.badgeText)}>
                    {theme}
                  </span>
                </div>

                {/* Section Quick Filter */}
                <div className="p-3 border-b border-sidebar-border/50 shrink-0">
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-sidebar-foreground/40" />
                    <input
                      type="text"
                      placeholder="Filter section..."
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="w-full bg-background border border-sidebar-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
                    />
                    {filterQuery && (
                      <button
                        onClick={() => setFilterQuery("")}
                        className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Child Links */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {filteredItems.length === 0 ? (
                    <div className="p-4 text-xs text-muted-foreground text-center">No items found</div>
                  ) : (
                    filteredItems.map((item) => {
                      // Check if another item in the active group has an exact or longer match for the current pathname
                      const isExactMatch = pathname === item.href
                      const hasExactSiblingMatch = activeGroup.items.some((other) => other.href === pathname)
                      const isActive = isExactMatch || (!hasExactSiblingMatch && item.href !== "/dashboard" && item.href !== "/settings" && pathname.startsWith(item.href + "/"))
                      const ItemIcon = item.icon

                      return (
                        <button
                          key={item.href}
                          onClick={() => {
                            if (item.target === "_blank") {
                              window.open(item.href, "_blank", "noopener,noreferrer")
                            } else {
                              router.push(item.href)
                            }
                          }}
                          className={cn(
                            "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left whitespace-nowrap",
                            isActive
                              ? cn("bg-sidebar-accent font-semibold border-l-2", accents.activeText, accents.activeBorder)
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          )}
                        >
                          {ItemIcon && <ItemIcon className="size-4 shrink-0" />}
                          <span className="truncate">{item.label}</span>
                        </button>
                      )
                    })
                  )}
                </div>

                {/* SINGLE-LINE SIDEBAR FOOTER (SPACE-BETWEEN) */}
                <div className="h-10 px-4 border-t border-sidebar-border bg-sidebar/50 flex items-center justify-between text-xs font-medium shrink-0 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                    </span>
                    <span className="text-[11px] text-emerald-500 font-semibold">System Healthy</span>
                  </div>

                  <Link
                    href={theme === "vendor" ? "/vendor/support/tickets" : "/dashboard/support/tickets"}
                    className="flex items-center gap-1 text-[11px] text-sidebar-foreground/60 hover:text-primary transition-colors"
                  >
                    <HeadphonesIcon className="size-3" />
                    <span>Support</span>
                  </Link>
                </div>
              </div>
            </aside>

            {/* MAIN CANVAS CONTAINER */}
            <div className="flex-1 bg-background flex flex-col min-w-0 overflow-hidden">

              {/* STREAMLINED MAIN HEADER (Toggle + Search | Notifications + Theme) */}
              <header className="h-14 border-b border-border bg-card/60 px-4 flex items-center justify-between shrink-0">
                {/* Left: Sidebar Collapse/Expand Toggle + Global Search */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsSubpanelOpen(!isSubpanelOpen)}
                    title="Toggle Submenu Sidebar"
                  >
                    {isSubpanelOpen ? <PanelLeftCloseIcon className="size-4" /> : <PanelLeftOpenIcon className="size-4" />}
                  </Button>

                  <Separator orientation="vertical" className="h-4" />

                  {/* Global Search Bar */}
                  <div className="relative w-64 md:w-80">
                    <SearchIcon className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search catalog, orders, users... (/)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg pl-9 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
                    />
                    <kbd className="absolute right-2 top-2 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border font-mono">
                      /
                    </kbd>
                  </div>
                </div>

                {/* Right: Notifications + Theme Switcher */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon-sm" title="Notifications" className="relative">
                    <BellIcon className="size-4" />
                    <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-blue-500" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggleTheme}
                    title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
                  >
                    {mode === "light" ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
                  </Button>
                </div>
              </header>

              {/* DEDICATED SUB-HEADER (BREADCRUMBS) */}
              <SubHeaderBreadcrumbs
                theme={theme}
                currentCategory={activeGroup.label}
                currentPage={currentPage}
              />

              {/* MAIN CONTENT PAGE BODY */}
              <main className="flex-1 overflow-y-auto p-6 bg-background/50">
                {children}
              </main>

              {/* COMPACT FOOTER */}
              <footer className="border-t bg-card/40 px-6 py-3 text-xs text-muted-foreground shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div>
                    &copy; {new Date().getFullYear()} MyMedDevices Kenya. All rights reserved.
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
                    <a href="mailto:support@mymeddevices.com" className="hover:text-foreground transition-colors">Support</a>
                  </div>
                </div>
              </footer>
            </div>

          </div>
        </SidebarProvider>
      </TooltipProvider>
    </AuthGuard>
  )
}

export { THEME_ACCENTS, DEFAULT_NAV_CONFIG }
