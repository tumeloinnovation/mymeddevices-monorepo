'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Something went wrong!</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                We encountered an error while loading this product. It might be a temporary issue.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => window.location.href = '/products'} variant="outline">
                    Back to Products
                </Button>
                <Button onClick={() => reset()}>
                    Try Again
                </Button>
            </div>
        </div>
    );
}
