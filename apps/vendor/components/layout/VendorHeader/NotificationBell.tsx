'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface NotificationBellProps {
  unreadCount?: number;
}

export function NotificationBell({ unreadCount = 0 }: NotificationBellProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-xs text-emerald-600 font-medium cursor-pointer hover:underline">
              Mark all as read
            </span>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {unreadCount === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No new notifications</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Notification items will go here in later phases */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-900 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
                <p className="text-sm font-medium">New Order #ORD-12345</p>
                <p className="text-xs text-slate-500 mt-1">2 minutes ago</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-2 border-t border-slate-200 dark:border-slate-800 text-center">
          <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
