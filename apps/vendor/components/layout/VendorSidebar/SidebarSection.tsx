'use client';

import React from 'react';
import { SidebarNavItem, type SidebarNavItemProps } from './SidebarNavItem';

interface SidebarSectionProps {
  title: string;
  items: Omit<SidebarNavItemProps, 'isCollapsed'>[];
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
        {items.map((item) => (
          <SidebarNavItem 
            key={item.href} 
            {...item} 
            isCollapsed={isCollapsed} 
          />
        ))}
      </div>
    </div>
  );
}
