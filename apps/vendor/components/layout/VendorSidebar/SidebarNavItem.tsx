'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface SidebarNavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  disabled?: boolean;
  isCollapsed: boolean;
}

export function SidebarNavItem({
  href,
  icon: Icon,
  label,
  badge,
  disabled,
  isCollapsed,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(href + '/');

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors cursor-pointer',
        isActive
          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
        isCollapsed && 'justify-center',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-emerald-600' : 'text-slate-500')} />
      {!isCollapsed && (
        <>
          <span className={cn('text-sm font-medium', isActive ? 'text-emerald-600' : 'text-slate-700')}>
            {label}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="ml-auto bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={disabled ? '#' : href} className="block w-full">
              {content}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link href={disabled ? '#' : href} className="block w-full">
      {content}
    </Link>
  );
}
