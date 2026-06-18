'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertCircle,
  RefreshCw,
  Home,
  Bug,
  Copy,
  Check,
  LifeBuoy,
  ShoppingBag,
  ArrowLeft
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const generateErrorId = () => {
  return `ERR-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
};

export default function Error({ error, reset }: ErrorProps) {
  const [errorId] = useState(generateErrorId());
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log the error details to the console
    console.group(`Customer Application Error [${errorId}]`);
    console.error('Message:', error.message || 'No message');
    console.error('Digest:', error.digest || 'N/A');
    console.error('Stack:', error.stack || 'No stack trace');
    console.error('Full Error Object:', error);
    console.groupEnd();
  }, [error, errorId]);

  const copyErrorDetails = () => {
    const details = `Error ID: ${errorId}
Message: ${error.message}
${error.digest ? `Digest: ${error.digest}` : ''}

Time: ${new Date().toISOString()}`;

    navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-purple-950/20">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent dark:from-blue-900/20" />

      <div className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="w-full max-w-3xl"
        >
          {/* Main error card */}
          <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-6 py-8 sm:py-10 text-center relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 animate-pulse delay-1000" />

              <div className="relative z-10 flex flex-col items-center gap-4">
                {/* Error icon */}
                <motion.div
                  initial={{ rotate: -10, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1
                  }}
                  className="flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm shadow-lg"
                >
                  <AlertCircle className="w-10 h-10 text-white" />
                </motion.div>

                {/* Error message */}
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Oops! Something went wrong
                  </h1>
                  <p className="text-white/90 text-sm sm:text-base max-w-md">
                    We encountered an unexpected error while processing your request.
                  </p>
                </div>

                {/* Error ID badge */}
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 text-xs sm:text-sm px-3 py-1"
                >
                  Error ID: {errorId}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Primary error message */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                  {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
              </div>

              {/* Expandable technical details */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Bug className="w-4 h-4" />
                  <span>{showDetails ? 'Hide' : 'Show'} technical details</span>
                </button>

                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-lg bg-muted p-4 border"
                  >
                    <div className="space-y-3">
                      {error.stack && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Stack Trace</p>
                          <pre className="text-xs text-foreground font-mono overflow-x-auto whitespace-pre-wrap bg-background p-3 rounded border">
                            {error.stack}
                          </pre>
                        </div>
                      )}

                      {error.digest && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Error Digest</p>
                          <code className="text-xs text-foreground font-mono bg-background px-2 py-1 rounded">
                            {error.digest}
                          </code>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Support information */}
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 p-4">
                <div className="flex items-start gap-3">
                  <LifeBuoy className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-indigo-900 dark:text-indigo-100">
                      Need help? Contact our customer support team with the Error ID above for faster assistance.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyErrorDetails}
                        className="h-8 text-xs"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy Error Details
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t">
                <Button
                  onClick={() => window.location.reload()}
                  size="lg"
                  className="w-full sm:w-auto min-w-[160px]"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>

                <Button
                  onClick={reset}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto min-w-[160px]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Try Again
                </Button>

                <Link href="/shop/products" className="w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full min-w-[160px]"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Continue Shopping
                  </Button>
                </Link>

                <Link href="/" className="w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full min-w-[140px]"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Additional help text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            If this error persists, please contact our customer support team with the Error ID above.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
