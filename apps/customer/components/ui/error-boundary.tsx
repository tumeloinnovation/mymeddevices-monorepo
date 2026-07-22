'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  LifeBuoy,
  Copy,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  copied: boolean;
}

const generateErrorId = () => {
  return `EB-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
};

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorId: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
      copied: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to error reporting service here (e.g., Sentry)
    // logErrorToService(error, errorInfo, this.state.errorId);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopy = () => {
    const details = `Error ID: ${this.state.errorId}
Message: ${this.state.error?.message}
Time: ${new Date().toISOString()}`;

    navigator.clipboard.writeText(details);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full max-w-lg"
          >
            <Card className="border-2 border-red-200 dark:border-red-800 shadow-xl">
              {/* Header */}
              <CardHeader className="text-center pb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="flex justify-center mb-4"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                </motion.div>

                <CardTitle className="text-2xl">Component Error</CardTitle>
                <CardDescription className="text-base">
                  A component encountered an unexpected error
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Error message */}
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
                  <p className="text-sm text-red-900 dark:text-red-100">
                    {this.state.error?.message || 'An unexpected error occurred in this component.'}
                  </p>
                </div>

                {/* Error ID */}
                {this.state.errorId && (
                  <div className="flex items-center justify-center">
                    <Badge variant="secondary" className="text-xs">
                      Error ID: {this.state.errorId}
                    </Badge>
                  </div>
                )}

                {/* Support info */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                  <div className="flex items-start gap-2">
                    <LifeBuoy className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-900 dark:text-blue-100">
                      This error has been logged. Contact support with the Error ID if needed.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <Button
                    onClick={this.handleReset}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Try Again
                  </Button>

                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Reload Page
                  </Button>

                  <Button
                    onClick={this.handleCopy}
                    variant="ghost"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    {this.state.copied ? (
                      <>
                        <Check className="w-3 h-3 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-2" />
                        Copy Details
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
