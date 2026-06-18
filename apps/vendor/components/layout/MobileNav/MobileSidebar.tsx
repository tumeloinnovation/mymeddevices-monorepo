'use client';

import React from 'react';
import { Store } from 'lucide-react';
import { vendorNavSections } from '@/lib/config/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarNavItem } from '../VendorSidebar/SidebarNavItem';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="p-0 w-72">
        <SheetHeader className="p-4 border-b border-slate-200 dark:border-slate-800">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Store className="text-white h-5 w-5" />
            </div>
            <span className="font-semibold text-lg text-slate-900 dark:text-white">
              Vendor Portal
            </span>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-64px)] py-4">
          <nav className="flex flex-col px-4 gap-6">
            {vendorNavSections.map((section) => (
              <div key={section.section} className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {section.section}
                </h3>
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <div key={item.href} onClick={onClose}>
                      <SidebarNavItem
                        {...item}
                        isCollapsed={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
