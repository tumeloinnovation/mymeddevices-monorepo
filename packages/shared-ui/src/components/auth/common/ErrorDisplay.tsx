'use client';

import { AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ErrorDisplayProps {
  error: string | null;
  className?: string;
}

export function ErrorDisplay({ error, className }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div
      className={cn(
        'mb-4 p-3 bg-destructive/10 border border-destructive/20',
        'text-destructive text-sm rounded-lg',
        'flex items-start gap-2',
        'animate-in fade-in slide-in-from-top-1',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{error}</span>
    </div>
  );
}
