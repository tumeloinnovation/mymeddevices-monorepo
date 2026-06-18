'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  React.useEffect(() => {
    console.error('Global customer error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-purple-950/20 flex items-center justify-center p-4">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent dark:from-blue-900/20" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="relative w-full max-w-2xl"
          >
            <Card className="border-2 border-blue-300 dark:border-blue-800 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="flex justify-center mb-4"
                >
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 text-white" />
                  </div>
                </motion.div>

                <h1 className="text-3xl font-bold text-white mb-2">
                  Application Error
                </h1>
                <p className="text-white/90">
                  The application has encountered an unexpected error.
                </p>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    We apologize for the inconvenience. This error has been logged and our team has been notified.
                  </p>

                  {error?.digest && (
                    <div className="rounded-lg bg-muted p-4 border">
                      <p className="text-xs text-muted-foreground mb-1">Error Reference</p>
                      <code className="text-sm font-mono">{error.digest}</code>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t">
                  <Button
                    onClick={() => window.location.reload()}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Application
                  </Button>

                  <Link href="/shop/products" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Continue Shopping
                    </Button>
                  </Link>

                  <Link href="/" className="w-full sm:w-auto">
                    <Button
                      variant="ghost"
                      size="lg"
                      className="w-full"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Homepage
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            <p className="text-center text-sm text-muted-foreground mt-6">
              If this error persists, please contact our customer support team.
            </p>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
