import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function ProductError({ retry }: { retry?: () => void }) {
  return (
    <div className="p-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white dark:bg-card border dark:border-border rounded-lg shadow-sm p-6 text-center transition-colors duration-300">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-full bg-red-50 dark:bg-destructive/20 text-red-600 dark:text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-muted-foreground">
          We couldn't load this product. Please check your connection or try again.
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          {retry ? (
            <Button onClick={retry}>Retry</Button>
          ) : null}

          <Link href="/" className="inline-block">
            <Button variant="ghost">Back to shop</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
