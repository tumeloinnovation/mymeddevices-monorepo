'use client';

import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface Step {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

interface ProgressIndicatorProps {
  steps: Step[];
  className?: string;
}

export function ProgressIndicator({ steps, className }: ProgressIndicatorProps) {
  return (
    <div className={cn('flex items-center justify-between mb-8', className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          {/* Step circle */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                step.status === 'complete' && 'bg-amber-400 text-white',
                step.status === 'active' && 'bg-orange-600 text-white',
                step.status === 'pending' && 'bg-orange-200 dark:bg-orange-800 text-muted-foreground'
              )}
            >
              {step.status === 'complete' ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={cn(
                'text-xs mt-1 text-center max-w-[80px]',
                step.status === 'active' && 'text-orange-600 dark:text-orange-400 font-medium',
                step.status === 'pending' && 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 h-0.5 mx-2 max-w-[40px]',
                steps[index + 1].status === 'complete'
                  ? 'bg-amber-400'
                  : 'bg-orange-200 dark:bg-orange-800'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
