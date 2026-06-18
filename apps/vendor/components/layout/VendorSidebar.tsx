'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import { vendorNavSections } from '@/lib/config/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { SidebarSection } from './VendorSidebar/SidebarSection';
import { SidebarUserMenu } from './VendorSidebar/SidebarUserMenu';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function VendorSidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <div
      className={cn(
        'flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 border-b border-slate-200 dark:border-slate-800 px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Store className="text-white h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg text-slate-900 dark:text-white">
              Vendor Portal
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col px-2">
          {vendorNavSections.map((section) => (
            <SidebarSection
              key={section.section}
              title={section.section}
              items={section.items}
              isCollapsed={collapsed}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* User Menu */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-2">
        <SidebarUserMenu isCollapsed={collapsed} />
      </div>

      {/* Collapse Button */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={onToggle}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

