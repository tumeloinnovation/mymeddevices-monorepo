'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SidebarUserMenuProps {
  isCollapsed: boolean;
}

export function SidebarUserMenu({ isCollapsed }: SidebarUserMenuProps) {
  const { user, logout } = useAuth();

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'VN';
  };

  const userDisplayName = user?.store_name || user?.name || user?.email || 'Vendor';

  const menuContent = (
    <DropdownMenuContent align={isCollapsed ? "start" : "end"} side={isCollapsed ? "right" : "bottom"} sideOffset={isCollapsed ? 16 : 4} className="w-56">
      <DropdownMenuLabel>
        <div className="flex flex-col">
          <span className="font-medium">My Account</span>
          <span className="text-xs text-slate-500">{user?.email}</span>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/vendor/settings/profile" className="cursor-pointer flex items-center">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="cursor-pointer text-rose-600 focus:text-rose-600 flex items-center"
        onClick={logout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-center p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-emerald-100 text-emerald-600 text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="text-sm">
                <p className="font-medium">{userDisplayName}</p>
                <p className="text-slate-500">Vendor</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {menuContent}
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-3 px-3 overflow-hidden">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-emerald-100 text-emerald-600 text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left overflow-hidden">
            <span className="text-sm font-medium text-slate-900 dark:text-white truncate w-full">
              {userDisplayName}
            </span>
            <span className="text-xs text-slate-500">Vendor</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      {menuContent}
    </DropdownMenu>
  );
}
