'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

export interface SidebarNavItemWithChildrenProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  disabled?: boolean;
  isCollapsed: boolean;
  children?: SidebarNavItemWithChildrenProps[];
  activePattern?: string;
}

export function SidebarNavItemWithChildren({
  href,
  icon: Icon,
  label,
  badge,
  disabled,
  isCollapsed,
  children = [],
  activePattern,
}: SidebarNavItemWithChildrenProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine if this item or any of its children are active
  const isActive = pathname === href || (activePattern && pathname?.startsWith(activePattern));
  const hasActiveChild = children.some(child => pathname === child.href);

  // Auto-expand if a child is active
  React.useEffect(() => {
    if (hasActiveChild && !isCollapsed) {
      setIsExpanded(true);
    }
  }, [hasActiveChild, isCollapsed]);

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  const content = (
    <div className="w-full">
      {/* Main Item */}
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
            <span className={cn('text-sm font-medium flex-1', isActive ? 'text-emerald-600' : 'text-slate-700')}>
              {label}
            </span>
            {badge !== undefined && badge > 0 && (
              <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
            {children.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-auto hover:bg-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Children */}
      {!isCollapsed && children.length > 0 && isExpanded && (
        <div className="ml-6 mt-1 flex flex-col gap-0.5">
          {children.map((child) => (
            <ChildNavItem key={child.href} {...child} isCollapsed={isCollapsed} />
          ))}
        </div>
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
            {children.length > 0 && (
              <div className="text-xs text-slate-400 mt-1">
                {children.map(c => c.label).join(', ')}
              </div>
            )}
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

function ChildNavItem({
  href,
  label,
  isCollapsed,
}: Omit<SidebarNavItemWithChildrenProps, 'children' | 'activePattern'>) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className="block w-full">
      <div
        className={cn(
          'flex items-center gap-2 w-full px-3 py-1.5 rounded-md transition-colors cursor-pointer text-sm',
          isActive
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 font-medium'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
        )}
      >
        {isActive && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
        <span>{label}</span>
      </div>
    </Link>
  );
}
