"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, UserIcon, SettingsIcon, CreditCardIcon, BellIcon, LogOutIcon } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@mymeddevices/shared-core"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()

  const listItems = [
    {
      icon: <UserIcon />,
      property: "Profile",
      href: "/dashboard",
    },
    {
      icon: <SettingsIcon />,
      property: "Settings",
      href: "/dashboard/settings",
    },
    {
      icon: <CreditCardIcon />,
      property: "Orders",
      href: "/dashboard/orders",
    },
    {
      icon: <BellIcon />,
      property: "Addresses",
      href: "/dashboard/addresses",
    },
    {
      icon: <LogOutIcon />,
      property: "Sign Out",
      href: "#",
      onClick: () => {
        // Handle sign out logic here
        useAuthStore.getState().logout();
        window.location.href = "/";
      },
    },
  ]

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
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {listItems.map((item, index) => (
                <DropdownMenuItem
                  key={index}
                  className="*:[svg]:text-muted-foreground"
                  onClick={item.onClick}
                >
                  {item.href !== "#" ? (
                    <Link href={item.href} className="flex items-center gap-2 w-full">
                      {item.icon}
                      <span className="text-popover-foreground">{item.property}</span>
                    </Link>
                  ) : (
                    <>
                      {item.icon}
                      <span className="text-popover-foreground">{item.property}</span>
                    </>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
