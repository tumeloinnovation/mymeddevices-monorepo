'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, ShieldCheck, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SettingsNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Store Profile',
      href: '/vendor/settings/profile',
      icon: Store,
    },
    {
      label: 'Security & Password',
      href: '/vendor/settings/security',
      icon: ShieldCheck,
    },
    {
      label: 'Notifications',
      href: '/vendor/settings/notifications',
      icon: Bell,
    },
  ];

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
      <nav className="flex space-x-2 md:space-x-4 overflow-x-auto pb-px" aria-label="Settings navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                isActive
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
