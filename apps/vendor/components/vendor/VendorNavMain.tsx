"use client";

import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { VendorRoute } from "./VendorSidebar";

export function VendorNavMain({ routes }: { routes: VendorRoute[] }) {
    const pathname = usePathname();

    return (
        <SidebarMenu>
            {routes.map((route) => {
                const isActive = pathname === route.link;

                return (
                    <SidebarMenuItem key={route.id}>
                        <SidebarMenuButton
                            tooltip={route.title}
                            asChild
                            isActive={isActive}
                        >
                            <Link href={route.link}>
                                {route.icon}
                                <span>{route.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}
