'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IconToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
  activeIconColor?: string;
  inactiveColor?: string;
  showLabel?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  ariaLabel?: string;
  className?: string;
}

export function IconToggleSwitch({
  checked,
  onCheckedChange,
  disabled = false,
  activeColor = 'bg-emerald-600 shadow-sm shadow-emerald-500/30',
  activeIconColor = 'text-emerald-600',
  inactiveColor = 'bg-slate-300 dark:bg-slate-700',
  showLabel = true,
  activeLabel = 'ON',
  inactiveLabel = 'OFF',
  ariaLabel,
  className,
}: IconToggleSwitchProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  return (
    <div className={cn('flex items-center gap-2 select-none', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
          disabled
            ? 'opacity-40 cursor-not-allowed bg-slate-200 dark:bg-slate-800'
            : checked
            ? activeColor
            : inactiveColor,
          'cursor-pointer'
        )}
      >
        <span
          className={cn(
            'pointer-events-none flex items-center justify-center h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        >
          {checked ? (
            <Check className={cn('h-3 w-3 stroke-[3] shrink-0', activeIconColor)} />
          ) : (
            <X className="h-3 w-3 text-slate-400 stroke-[3] shrink-0" />
          )}
        </span>
      </button>
      {showLabel && (
        <span
          className={cn(
            'text-xs font-bold w-7 text-right',
            checked ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
          )}
        >
          {checked ? activeLabel : inactiveLabel}
        </span>
      )}
    </div>
  );
}
