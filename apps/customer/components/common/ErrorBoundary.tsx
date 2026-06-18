"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Optional fallback component to render instead of default error UI */
  fallback?: ReactNode;
  /** Optional callback for error logging */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);

    // Call optional error logging callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Optionally log to external service here
    // logErrorToService(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const isDev = process.env.NODE_ENV === "development";

      return (
        <div className="min-h-[400px] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-8">
              We encountered an unexpected error. This has been logged and we'll look into it.
            </p>

            {/* Development-only error details */}
            {isDev && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-destructive mb-2 hover:underline">
                  Error Details (Dev Only)
                </summary>
                <div className="mt-2 p-4 bg-muted rounded-md overflow-x-auto">
                  <pre className="text-xs text-destructive font-mono whitespace-pre-wrap break-all">
                    {this.state.error.toString()}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={this.handleReload}
                variant="default"
                size="lg"
                className="gap-2 w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              <Button
                onClick={this.handleReset}
                variant="outline"
                size="lg"
                className="gap-2 w-full sm:w-auto"
              >
                Try Again
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="gap-2 w-full sm:w-auto"
              >
                <a href="/">
                  <Home className="h-4 w-4" />
                  Go Home
                </a>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;