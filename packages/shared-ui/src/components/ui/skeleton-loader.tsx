'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/utils';

interface SkeletonLoaderProps {
    className?: string;
    count?: number;
    type?: 'table-row' | 'card' | 'text';
}

export function SkeletonLoader({ className, count = 1, type = 'text' }: SkeletonLoaderProps) {
    return (
        <div className={cn('w-full space-y-3', className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="w-full">
                    {type === 'text' && (
                        <Skeleton className="h-4 w-full" />
                    )}
                    {type === 'card' && (
                        <Skeleton className="h-[125px] w-full rounded-xl" />
                    )}
                    {type === 'table-row' && (
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-full" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
