'use client';

import React from 'react';
import { SidebarNavItem, type SidebarNavItemProps } from './SidebarNavItem';
import { SidebarNavItemWithChildren, type SidebarNavItemWithChildrenProps } from './SidebarNavItemWithChildren';
import type { NavItem } from '@/lib/config/navigation';

interface SidebarSectionProps {
  title: string;
  items: NavItem[];
  isCollapsed: boolean;
}

export function SidebarSection({
  title,
  items,
  isCollapsed,
}: SidebarSectionProps) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      {!isCollapsed && (
        <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          {title}
        </h3>
      )}
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const hasChildren = item.children && item.children.length > 0;

          if (hasChildren) {
            return (
              <SidebarNavItemWithChildren
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                isCollapsed={isCollapsed}
                children={item.children}
                activePattern={item.activePattern}
              />
            );
          }

          return (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              isCollapsed={isCollapsed}
            />
          );
        })}
      </div>
    </div>
  );
}
