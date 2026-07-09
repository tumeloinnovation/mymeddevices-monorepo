"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Package, ShoppingBag, Store, Settings, Warehouse } from "lucide-react";
import { VendorNavMain } from "./VendorNavMain";
import { VendorNavUser } from "./VendorNavUser";

export interface VendorRoute {
    id: string;
    title: string;
    icon: React.ReactNode;
    link: string;
}

const vendorRoutes: VendorRoute[] = [
    {
        id: "dashboard",
        title: "Dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
        link: "/vendor/dashboard",
    },
    {
        id: "products",
        title: "Products",
        icon: <Package className="h-5 w-5" />,
        link: "/vendor/products",
    },
    {
        id: "orders",
        title: "Orders",
        icon: <ShoppingBag className="h-5 w-5" />,
        link: "/vendor/orders",
    },

    // {
    //     id: "settings",
    //     title: "Settings",
    //     icon: <Settings className="h-5 w-5" />,
    //     link: "/vendor/settings",
    // },
];

export function VendorSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-2">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Store className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold">MyMedDevices</span>
                        <span className="truncate text-xs">Vendor Portal</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <VendorNavMain routes={vendorRoutes} />
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <VendorNavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
