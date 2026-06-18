'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import { ThemeToggle } from './VendorHeader/ThemeToggle';
import { NotificationBell } from './VendorHeader/NotificationBell';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/lib/hooks/use-breadcrumbs';

interface VendorHeaderProps {
  onMenuClick: () => void;
}

export function VendorHeader({ onMenuClick }: VendorHeaderProps) {
  const { user } = useAuth();
  const breadcrumbs = useBreadcrumbs();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb */}
        {breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell unreadCount={1} />

        <div className="h-8 w-px bg-slate-200 dark:border-slate-800 mx-2" />
        
        <div className="flex flex-col items-end hidden sm:flex">
          <span className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[150px]">
            {user?.store_name || 'My Store'}
          </span>
          <span className="text-xs text-slate-500">Vendor</span>
        </div>
      </div>
    </header>
  );
}
