"use client"

import { useAuthStore, AuthGuard, useAuthCookie, getUserDisplayName, type UserRole } from "@mymeddevices/shared-core"
import { SidebarLogo } from "./logo"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
  SidebarRail,
  SidebarInput,
  useSidebar,
} from "@/components/ui/sidebar"
import { XIcon } from "lucide-react"
import {
  LayoutDashboardIcon,
  UsersIcon,
  CogIcon,
  SettingsIcon,
  PackageIcon,
  ShoppingCartIcon,
  TagIcon,
  BarChart3Icon,
  StoreIcon,
  FileTextIcon,
  CreditCardIcon,
  TruckIcon,
  AlertCircleIcon,
  LogOutIcon,
  ChevronsUpDownIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ChevronRightIcon,
  MessageSquareIcon,
  FolderTreeIcon,
  TrendingUpIcon,
  HeadphonesIcon,
  FileEditIcon,
  MegaphoneIcon,
  GitBranchIcon,
  ShieldIcon,
  ActivityIcon,
  HeartIcon,
  MapPinIcon,
  ClockIcon,
  SearchIcon,
  LockIcon,
  EyeIcon,
  type LucideIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
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
    {
      label: "Overview",
      icon: LayoutDashboardIcon,
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
      ],
    },
    {
      label: "Analytics",
      icon: BarChart3Icon,
      items: [
        { label: "Overview", href: "/dashboard/analytics", icon: BarChart3Icon },
        { label: "Shopping Analytics", href: "/dashboard/shopping/analytics", icon: BarChart3Icon },
        { label: "Customer Analytics", href: "/dashboard/analytics/customers", icon: UsersIcon },
        { label: "Product Analytics", href: "/dashboard/analytics/products", icon: PackageIcon },
      ],
    },
    {
      label: "Reports",
      icon: TrendingUpIcon,
      items: [
        { label: "Sales Reports", href: "/dashboard/reports/sales", icon: TrendingUpIcon },
        { label: "Inventory Reports", href: "/dashboard/reports/inventory", icon: PackageIcon },
        { label: "Customer Insights", href: "/dashboard/reports/customers", icon: UsersIcon },
        { label: "Vendor Performance", href: "/dashboard/reports/vendors", icon: StoreIcon },
      ],
    },
    {
      label: "Catalog",
      icon: PackageIcon,
      items: [
        { label: "Products", href: "/dashboard/catalog/products", icon: PackageIcon },
        { label: "Categories", href: "/dashboard/catalog/categories", icon: FolderTreeIcon },
        { label: "Brands", href: "/dashboard/catalog/brands", icon: TagIcon },
        { label: "Tags", href: "/dashboard/catalog/tags", icon: TagIcon },
      ],
    },
    {
      label: "Orders",
      icon: ShoppingCartIcon,
      items: [
        { label: "Orders", href: "/dashboard/shopping/orders", icon: ShoppingCartIcon },
        { label: "Order Statuses", href: "/dashboard/shopping/order-statuses", icon: GitBranchIcon },
        { label: "Returns", href: "/dashboard/shopping/returns", icon: AlertCircleIcon },
        { label: "Refunds", href: "/dashboard/shopping/refunds", icon: CreditCardIcon },
        { label: "Coupons", href: "/dashboard/shopping/coupons", icon: TagIcon },
      ],
    },
    {
      label: "Users",
      icon: UsersIcon,
      items: [
        { label: "Customers", href: "/dashboard/users/customers", icon: UsersIcon },
        { label: "Vendors", href: "/dashboard/vendors", icon: StoreIcon },
        { label: "Staff", href: "/dashboard/users/staff", icon: UsersIcon },
        { label: "Reviews", href: "/dashboard/users/reviews", icon: MessageSquareIcon },
      ],
    },
    {
      label: "Financial",
      icon: CreditCardIcon,
      items: [
        { label: "Payments", href: "/dashboard/payments", icon: CreditCardIcon },
        { label: "Invoices", href: "/dashboard/financial/invoices", icon: FileTextIcon },
        { label: "Payouts", href: "/dashboard/financial/payouts", icon: CreditCardIcon },
        { label: "Tax Settings", href: "/dashboard/financial/tax", icon: FileEditIcon },
      ],
    },
    {
      label: "Shipping",
      icon: TruckIcon,
      items: [
        { label: "Delivery Tracking", href: "/dashboard/shipping/tracking", icon: ActivityIcon },
        { label: "Warehouse", href: "/dashboard/shipping/warehouse", icon: PackageIcon },
      ],
    },
    {
      label: "Support",
      icon: HeadphonesIcon,
      items: [
        { label: "Support Tickets", href: "/dashboard/support/tickets", icon: HeadphonesIcon },
        { label: "Disputes", href: "/dashboard/support/disputes", icon: AlertCircleIcon },
      ],
    },
    {
      label: "System",
      icon: SettingsIcon,
      items: [
        { label: "Settings", href: "/settings", icon: SettingsIcon },
        { label: "System Health", href: "/dashboard/system/health", icon: ActivityIcon },
        { label: "Audit Logs", href: "/dashboard/system/audit-logs", icon: ShieldIcon },
        { label: "Feature Flags", href: "/dashboard/system/feature-flags", icon: GitBranchIcon },
      ],
    },
  ],
  vendor: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
        { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3Icon },
        { label: "Reviews", href: "/dashboard/reviews", icon: MessageSquareIcon },
      ],
    },
    {
      label: "Store",
      items: [
        { label: "My Products", href: "/dashboard/products", icon: PackageIcon },
        { label: "Orders", href: "/dashboard/orders", icon: ShoppingCartIcon },
        { label: "Inventory", href: "/dashboard/inventory", icon: StoreIcon },
        { label: "Pricing", href: "/dashboard/pricing", icon: TagIcon },
        { label: "Customers", href: "/dashboard/customers", icon: UsersIcon },
        { label: "Discounts", href: "/dashboard/discounts", icon: TagIcon },
      ],
    },
    {
      label: "Fulfillment",
      items: [
        { label: "Shipping", href: "/dashboard/shipping", icon: TruckIcon },
        { label: "Deliveries", href: "/dashboard/deliveries", icon: TruckIcon },
        { label: "Returns", href: "/dashboard/returns", icon: AlertCircleIcon },
      ],
    },
    {
      label: "Financial",
      items: [
        { label: "Payments", href: "/dashboard/payments", icon: CreditCardIcon },
        { label: "Transactions", href: "/dashboard/transactions", icon: CreditCardIcon },
        { label: "Invoices", href: "/dashboard/invoices", icon: FileTextIcon },
      ],
    },
    {
      label: "Settings",
      items: [
        { label: "Store Settings", href: "/settings", icon: SettingsIcon },
        { label: "Profile", href: "/dashboard/profile", icon: UsersIcon },
      ],
    },
  ],
  customer: [
    {
      label: "Dashboard",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
      ],
    },
    {
      label: "My Account",
      items: [
        { label: "Profile", href: "/dashboard/profile", icon: UsersIcon },
        { label: "Payment Methods", href: "/dashboard/payment-methods", icon: CreditCardIcon },
        { label: "Addresses", href: "/dashboard/addresses", icon: MapPinIcon },
        { label: "Communication", href: "/dashboard/communication", icon: BellIcon },
      ],
    },
    {
      label: "My Orders",
      items: [
        { label: "Orders", href: "/dashboard/orders", icon: ShoppingCartIcon },
        { label: "Returns", href: "/dashboard/returns", icon: AlertCircleIcon },
        { label: "Order Tracking", href: "/dashboard/tracking", icon: TruckIcon },
      ],
    },
    {
      label: "My Stuff",
      items: [
        { label: "Wishlist", href: "/dashboard/wishlist", icon: HeartIcon },
        { label: "Recently Viewed", href: "/dashboard/recently-viewed", icon: ClockIcon },
        { label: "Saved Searches", href: "/dashboard/saved-searches", icon: SearchIcon },
      ],
    },
    {
      label: "Medical",
      items: [
        { label: "Prescriptions", href: "/dashboard/prescriptions", icon: FileTextIcon },
        { label: "Insurance", href: "/dashboard/insurance", icon: ShieldIcon },
      ],
    },
    {
      label: "Settings",
      items: [
        { label: "Preferences", href: "/dashboard/preferences", icon: SettingsIcon },
        { label: "Security", href: "/dashboard/security", icon: LockIcon },
        { label: "Privacy", href: "/dashboard/privacy", icon: EyeIcon },
      ],
    },
  ],
}

const THEME_COLORS: Record<DashboardTheme, { primary: string; hover: string; accent: string }> = {
  admin: {
    primary: "bg-blue-600",
    hover: "hover:bg-blue-500",
    accent: "focus:border-blue-400 focus:ring-blue-100",
  },
  vendor: {
    primary: "bg-orange-600",
    hover: "hover:bg-orange-500",
    accent: "focus:border-orange-400 focus:ring-orange-100",
  },
  customer: {
    primary: "bg-emerald-600",
    hover: "hover:bg-emerald-500",
    accent: "focus:border-emerald-400 focus:ring-emerald-100",
  },
}

const ALLOWED_ROLES: Record<DashboardTheme, UserRole[]> = {
  admin: ["admin", "worker"],
  vendor: ["vendor"],
  customer: ["customer"],
}

const DEFAULT_INITIALS: Record<DashboardTheme, string> = {
  admin: "A",
  vendor: "V",
  customer: "C",
}

const DEFAULT_USER_LABEL: Record<DashboardTheme, string> = {
  admin: "Admin",
  vendor: "Vendor",
  customer: "Customer",
}

function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">("light")

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

function Breadcrumbs({ theme }: { theme: DashboardTheme }) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const dashboardHref = theme === "vendor" ? "/vendor/dashboard" : "/dashboard"

  // Start with a Home/Dashboard root
  const breadcrumbs = [
    { label: "Dashboard", href: dashboardHref, isLast: pathname === dashboardHref }
  ]

  // If we are not on the dashboard, add other segments
  if (pathname !== dashboardHref && pathname !== "/") {
    segments.forEach((segment, index) => {
      // Skip "dashboard" segment if it's the first one to avoid "Dashboard > Dashboard"
      if (segment === "dashboard" && index === 0) return

      const href = "/" + segments.slice(0, index + 1).join("/")
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
      const isLast = index === segments.length - 1

      breadcrumbs.push({
        label,
        href,
        isLast
      })
    })
  }

  // Ensure last item is marked as last
  if (breadcrumbs.length > 0) {
    breadcrumbs[breadcrumbs.length - 1].isLast = true
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {breadcrumbs.map((item, index) => (
        <span key={item.href + index} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRightIcon className="size-3.5 shrink-0" />}
          {item.isLast ? (
            <span className="font-medium text-foreground" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
    </Button>
  )
}

function NotificationBell() {
  return (
    <Button variant="ghost" size="icon-sm" aria-label="Notifications">
      <BellIcon className="size-4" />
    </Button>
  )
}

function SidebarBranding({ theme }: { theme: DashboardTheme }) {
  const dashboardHref = theme === "vendor" ? "/vendor/dashboard" : "/dashboard"

  return (
    <div className="px-3 py-2">
      <Link href={dashboardHref} className="flex items-center justify-center">
        <SidebarLogo theme={theme} />
      </Link>
    </div>
  )
}

function SidebarSearch({
  searchQuery,
  setSearchQuery,
  inputRef,
}: {
  searchQuery: string
  setSearchQuery: (query: string) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  if (isCollapsed) return null

  return (
    <div className="px-2 pb-1">
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-sidebar-foreground/50" />
        <SidebarInput
          ref={inputRef}
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-7 text-[13px]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            aria-label="Clear search"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function SidebarNav({ navConfig, theme, searchQuery }: { navConfig: NavConfig; theme: DashboardTheme; searchQuery: string }) {
  const pathname = usePathname()
  const dashboardHref = theme === "vendor" ? "/vendor/dashboard" : "/dashboard"
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)

  // Determine which group should be expanded
  const getExpandedGroup = () => {
    // If searching, expand all matching groups
    if (searchQuery.trim()) {
      return null // null means expand all (handled in render)
    }
    // If hovering, expand the hovered group
    if (hoveredGroup) {
      return hoveredGroup
    }
    // Otherwise, expand the active group
    for (const group of navConfig) {
      const isGroupActive = group.items.some((item) =>
        pathname === item.href || pathname.startsWith(item.href + "/")
      )
      if (isGroupActive) {
        return group.label
      }
    }
    return null
  }

  const expandedGroup = getExpandedGroup()

  // Get the active item label for each group
  const getActiveItemLabel = (items: NavItem[]) => {
    return items.find((item) =>
      pathname === item.href || pathname.startsWith(item.href + "/")
    )?.label
  }

  // Filter groups and items based on search query
  const filteredNavConfig = useMemo(() => {
    if (!searchQuery.trim()) {
      return navConfig
    }

    const query = searchQuery.toLowerCase()

    return navConfig
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.label.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [navConfig, searchQuery])

  const renderGroupItems = (items: NavItem[]) => {
    return items.map((item) => {
      const isActive =
        pathname === item.href ||
        (pathname.startsWith(item.href + "/") && item.href !== dashboardHref)

      return (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
            <Link href={item.href} target={item.target} rel={item.target === "_blank" ? "noopener noreferrer" : undefined}>
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    })
  }

  if (filteredNavConfig.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-sidebar-foreground/50 text-center">
        No results found
      </div>
    )
  }

  // Determine if a group should show its items
  const shouldShowItems = (groupLabel: string) => {
    // Always show items when searching
    if (searchQuery.trim()) return true
    // Show items if this is the hovered group
    if (hoveredGroup === groupLabel) return true
    // Show items if this is the active group
    if (expandedGroup === groupLabel) return true
    return false
  }

  return (
    <>
      {filteredNavConfig.map((group) => {
        const showItems = shouldShowItems(group.label)
        const isGroupActive = expandedGroup === group.label
        const activeItemLabel = getActiveItemLabel(group.items)
        const itemCount = group.items.length

        return (
          <div
            key={group.label}
            className="group/nav-group"
            onMouseEnter={() => setHoveredGroup(group.label)}
            onMouseLeave={() => setHoveredGroup(null)}
          >
            <SidebarGroup>
              <SidebarGroupLabel
                className={cn(
                  "flex items-center justify-between cursor-pointer transition-colors",
                  isGroupActive && "text-sidebar-foreground",
                  !isGroupActive && "hover:text-sidebar-foreground/80"
                )}
              >
                <div className="flex items-center gap-2">
                  {group.icon && <group.icon className="size-3.5" />}
                  <span>{group.label}</span>
                </div>
              </SidebarGroupLabel>
              {/* Active item indicator when collapsed */}
              {!showItems && activeItemLabel && (
                <div className="px-3 text-xs text-sidebar-foreground/50 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-sidebar-primary/60"></span>
                  <span className="truncate">{activeItemLabel}</span>
                </div>
              )}
              <SidebarMenu
                className={cn(
                  "transition-all duration-200 ease-out overflow-hidden",
                  showItems ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                {renderGroupItems(group.items)}
              </SidebarMenu>
            </SidebarGroup>
          </div>
        )
      })}
    </>
  )
}

function SidebarUserMenu({ theme }: { theme: DashboardTheme }) {
  const { user, logout, isLoading } = useAuthStore()
  const { clearAuthCookie } = useAuthCookie()
  const router = useRouter()

  const displayName = getUserDisplayName(user);
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

  // Mock stats - in production these would come from an API
  const stats = {
    pendingOrders: 12,
    unreadMessages: 3,
    systemHealth: "healthy" as "healthy" | "warning" | "error",
  }

  return (
    <SidebarFooter className="flex flex-col gap-0 p-2">
      {/* System Status Bar */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-1 rounded-md bg-sidebar-accent/50">
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            stats.systemHealth === "healthy" && "bg-success",
            stats.systemHealth === "warning" && "bg-warning",
            stats.systemHealth === "error" && "bg-destructive"
          )} />
          <span className="text-xs text-sidebar-foreground/70">
            {stats.systemHealth === "healthy" ? "Systems operational" : "Attention needed"}
          </span>
        </div>
        <Link
          href="/dashboard/system/health"
          className="text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          View
        </Link>
      </div>

      {/* User Menu */}
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{displayName || DEFAULT_USER_LABEL[theme]}</span>
                    <span className="text-[10px] px-1 py-0.5 rounded bg-sidebar-primary/20 text-sidebar-primary">
                      {user?.role || "Admin"}
                    </span>
                  </div>
                  <span className="truncate text-xs">{user?.email || ""}</span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side="right"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName || DEFAULT_USER_LABEL[theme]}</span>
                    <span className="truncate text-xs">{user?.email || ""}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={theme === "vendor" ? "/vendor/settings/profile" : theme === "customer" ? "/dashboard/profile" : "/settings"} className="cursor-pointer">
                  <SettingsIcon className="mr-2 size-4" />
                  Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
                <LogOutIcon className="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}

export default function DashboardLayout({
  children,
  theme = "admin",
  navConfig,
}: DashboardLayoutProps) {
  const config = navConfig || DEFAULT_NAV_CONFIG[theme]
  const allowedRoles = ALLOWED_ROLES[theme]
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Keyboard shortcut to focus search (/)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !event.ctrlKey && !event.metaKey) {
        const activeElement = document.activeElement
        const isInputActive = activeElement instanceof HTMLInputElement ||
                              activeElement instanceof HTMLTextAreaElement

        if (!isInputActive) {
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
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <SidebarBranding theme={theme} />
              <SidebarSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} inputRef={searchInputRef} />
            </SidebarHeader>
            <SidebarContent className="overflow-hidden">
              <SidebarNav navConfig={config} theme={theme} searchQuery={searchQuery} />
            </SidebarContent>
            <SidebarFooter>
              <SidebarUserMenu theme={theme} />
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <SidebarInset id="main-content">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                <Breadcrumbs theme={theme} />
                <div className="ml-auto flex items-center gap-1">
                  <NotificationBell />
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <div className="flex-1 p-6">{children}</div>
            <footer className="border-t bg-card/50 backdrop-blur-xs px-6 py-4 text-xs text-muted-foreground">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  &copy; {new Date().getFullYear()} MyMedDevices. All rights reserved.
                </div>
                <div className="flex items-center gap-6">
                  <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy Policy</Link>
                  <Link href="/terms" className="transition-colors hover:text-foreground">Terms of Service</Link>
                  <a href="mailto:support@mymeddevices.com" className="transition-colors hover:text-foreground">Support</a>
                </div>
              </div>
            </footer>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AuthGuard>
  )
}

export { THEME_COLORS, DEFAULT_NAV_CONFIG }
