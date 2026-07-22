'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProfileCompletenessData } from '@/lib/data/profile-validation';
import { calculateProfileCompleteness, getMissingFields } from '@/lib/data/profile-validation';

interface ProfileCompletenessRingProps {
  profile: Partial<ProfileCompletenessData>;
  className?: string;
}

/**
 * Circular progress indicator showing profile completeness
 * Displays percentage and shows missing fields on hover
 */
export function ProfileCompletenessRing({ profile, className }: ProfileCompletenessRingProps) {
  const percentage = calculateProfileCompleteness(profile);
  const missingFields = getMissingFields(profile);
  const isComplete = percentage === 100;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('relative', className)}>
            {/* Circular progress using SVG */}
            <svg className="h-20 w-20 transform -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted opacity-20"
              />
              {/* Progress circle */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${percentage}, 100`}
                className={cn(
                  'transition-all duration-500 ease-out',
                  isComplete ? 'text-green-500' : 'text-primary'
                )}
                strokeLinecap="round"
              />
            </svg>

            {/* Percentage in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isComplete ? (
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in duration-300">
                  <Check className="h-5 w-5 text-white" />
                </div>
              ) : (
                <span className="text-sm font-semibold">{percentage}%</span>
              )}
            </div>
          </div>
        </TooltipTrigger>

        <TooltipContent side="bottom" className="max-w-xs">
          {isComplete ? (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="font-medium">Your profile is complete!</span>
            </div>
          ) : (
            <div>
              <p className="font-medium mb-1">Complete your profile:</p>
              <ul className="text-sm space-y-1">
                {missingFields.map((field) => (
                  <li key={field} className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    <span className="capitalize">Add {field}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact profile completeness badge for smaller spaces
 */
export function ProfileCompletenessBadge({ profile, className }: ProfileCompletenessRingProps) {
  const percentage = calculateProfileCompleteness(profile);
  const isComplete = percentage === 100;

  return (
    <Badge
      variant={isComplete ? 'default' : 'secondary'}
      className={cn('gap-1.5', isComplete && 'bg-green-500 hover:bg-green-600', className)}
    >
      {isComplete ? (
        <>
          <Check className="h-3 w-3" />
          Complete
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3" />
          {percentage}%
        </>
      )}
    </Badge>
  );
}
