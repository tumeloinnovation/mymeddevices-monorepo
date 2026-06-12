"use client"

import { useAuthStore, AuthGuard, useAuthCookie, type UserRole } from "@mymeddevices/shared-core"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
  SidebarRail,
  SidebarMenuAction,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible"
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
  ChevronDownIcon,
  MessageSquareIcon,
  FolderTreeIcon,
  type LucideIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export type DashboardTheme = "admin" | "vendor"

export type NavItem = {
  label: string
  href: string
  icon?: LucideIcon
  children?: NavItem[]
  isCollapsible?: boolean
}

export type NavGroup = {
  label: string
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
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
        { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3Icon },
      ],
    },
    {
      label: "Ecommerce",
      items: [
        {
          label: "Catalog",
          href: "/dashboard/catalog",
          icon: TagIcon,
          isCollapsible: true,
          children: [
            { label: "Overview", href: "/dashboard/catalog", icon: PackageIcon },
            { label: "Products", href: "/dashboard/catalog/products", icon: PackageIcon },
            { label: "Categories", href: "/dashboard/catalog/categories", icon: FolderTreeIcon },
            { label: "Brands", href: "/dashboard/catalog/brands", icon: TagIcon },
            { label: "Tags", href: "/dashboard/catalog/tags", icon: TagIcon },
          ],
        },
        { label: "Orders", href: "/dashboard/orders", icon: ShoppingCartIcon },
        { label: "Customers", href: "/dashboard/customers", icon: UsersIcon },
        { label: "Inventory", href: "/dashboard/inventory", icon: StoreIcon },
        { label: "Payments", href: "/dashboard/payments", icon: CreditCardIcon },
        { label: "Shipping", href: "/dashboard/shipping", icon: TruckIcon },
      ],
    },
    {
      label: "Content",
      items: [
        { label: "Pages", href: "/dashboard/pages", icon: FileTextIcon },
        { label: "Banners", href: "/dashboard/banners", icon: FileTextIcon },
      ],
    },
    {
      label: "Management",
      items: [
        { label: "Users", href: "/users", icon: UsersIcon },
        { label: "Vendors", href: "/dashboard/vendors", icon: StoreIcon },
        { label: "System", href: "/system", icon: CogIcon },
        { label: "Settings", href: "/settings", icon: SettingsIcon },
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
}

const ALLOWED_ROLES: Record<DashboardTheme, UserRole[]> = {
  admin: ["admin", "worker"],
  vendor: ["vendor"],
}

const DEFAULT_INITIALS: Record<DashboardTheme, string> = {
  admin: "A",
  vendor: "V",
}

const DEFAULT_USER_LABEL: Record<DashboardTheme, string> = {
  admin: "Admin",
  vendor: "Vendor",
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

function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  // Start with a Home/Dashboard root
  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard", isLast: pathname === "/dashboard" }
  ]

  // If we are not on the dashboard, add other segments
  if (pathname !== "/dashboard" && pathname !== "/") {
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
            <a href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </a>
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
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <a href="/dashboard">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <span className="text-sm font-bold">M</span>
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">MyMedDevices</span>
              <span className="truncate text-xs">{theme === "admin" ? "Admin" : "Vendor"}</span>
            </div>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function SidebarNav({ navConfig }: { navConfig: NavConfig }) {
  const pathname = usePathname()

  return (
    <>
      {navConfig.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              // Check if this item has children (collapsible)
              if (item.children && item.children.length > 0) {
                // Check if any child or the parent is active
                const isParentActive =
                  pathname === item.href ||
                  item.children.some((child) =>
                    pathname === child.href || pathname.startsWith(child.href + "/")
                  )

                return (
                  <Collapsible key={item.href} asChild defaultOpen={isParentActive}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.label} isActive={isParentActive}>
                          {item.icon && <item.icon className="size-4" />}
                          <span>{item.label}</span>
                          <ChevronDownIcon className="ml-auto size-4 shrink-0 opacity-50" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === child.href}
                              >
                                <a href={child.href}>
                                  {child.icon && <child.icon className="size-4" />}
                                  <span>{child.label}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              }

              // Regular menu item (non-collapsible)
              const isActive =
                pathname === item.href ||
                (pathname.startsWith(item.href + "/") && item.href !== "/dashboard")

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                    <a href={item.href}>
                      {item.icon && <item.icon className="size-4" />}
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}

function SidebarUserMenu({ theme }: { theme: DashboardTheme }) {
  const { user, logout, isLoading } = useAuthStore()
  const { clearAuthCookie } = useAuthCookie()
  const router = useRouter()

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || user?.email?.[0]?.toUpperCase() || DEFAULT_INITIALS[theme]

  const handleLogout = async () => {
    await logout()
    clearAuthCookie()
    router.push("/login")
  }

  return (
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
                <span className="truncate font-medium">{user?.name || DEFAULT_USER_LABEL[theme]}</span>
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
                  <span className="truncate font-medium">{user?.name || DEFAULT_USER_LABEL[theme]}</span>
                  <span className="truncate text-xs">{user?.email || ""}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
              <LogOutIcon className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export default function DashboardLayout({
  children,
  theme = "admin",
  navConfig,
}: DashboardLayoutProps) {
  const config = navConfig || DEFAULT_NAV_CONFIG[theme]
  const allowedRoles = ALLOWED_ROLES[theme]

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarBranding theme={theme} />
          </SidebarHeader>
          <SidebarContent>
            <div className="overflow-y-auto h-[calc(100vh-8rem)]">
              <SidebarNav navConfig={config} />
            </div>
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
              <Breadcrumbs />
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
                <a href="/privacy" className="transition-colors hover:text-foreground">Privacy Policy</a>
                <a href="/terms" className="transition-colors hover:text-foreground">Terms of Service</a>
                <a href="mailto:support@mymeddevices.com" className="transition-colors hover:text-foreground">Support</a>
              </div>
            </div>
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}

export { THEME_COLORS, DEFAULT_NAV_CONFIG }
