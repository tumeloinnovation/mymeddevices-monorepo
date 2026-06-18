"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  RefreshCw,
  Home,
  LifeBuoy,
  ArrowLeft,
  Server,
  Wifi,
  AlertTriangle,
  Bug
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type ErrorType = "general" | "server" | "network" | "not-found" | "permission";

interface ErrorStateProps {
  title?: string;
  description?: string;
  details?: string;
  errorType?: ErrorType;
  errorCode?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  retryLabel?: string;
  showSupport?: boolean;
  compact?: boolean;
}

const errorConfig = {
  general: {
    icon: AlertTriangle,
    gradient: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    supportMessage: "If this problem persists, please contact support."
  },
  server: {
    icon: Server,
    gradient: "from-red-500 to-rose-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    title: "Server error",
    description: "Our servers are experiencing issues. Please try again later.",
    supportMessage: "Our team has been notified and is working on a fix."
  },
  network: {
    icon: Wifi,
    gradient: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    title: "Connection error",
    description: "Unable to connect to our services. Please check your internet connection.",
    supportMessage: "Make sure you're connected to the internet and try again."
  },
  "not-found": {
    icon: AlertCircle,
    gradient: "from-purple-500 to-indigo-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    title: "Page not found",
    description: "The page or resource you're looking for doesn't exist.",
    supportMessage: "The link may be broken or the page has been moved."
  },
  permission: {
    icon: AlertTriangle,
    gradient: "from-yellow-500 to-amber-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    title: "Access denied",
    description: "You don't have permission to access this resource.",
    supportMessage: "Contact your administrator if you believe this is an error."
  }
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  details,
  errorType = "general",
  errorCode,
  onRetry,
  onGoBack,
  retryLabel = "Try Again",
  showSupport = true,
  compact = false
}) => {
  const config = errorConfig[errorType];
  const Icon = config.icon;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex items-center justify-center py-8"
      >
        <Card className={`w-full max-w-lg border ${config.borderColor} ${config.bgColor}`}>
          <div className="flex items-center gap-4 p-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{title || config.title}</h4>
              <p className="text-xs text-muted-foreground truncate">{description || config.description}</p>
              {details && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">{details}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="shrink-0"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  {retryLabel}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex items-center justify-center min-h-[400px] p-4"
    >
      <Card className={`w-full max-w-2xl overflow-hidden ${config.borderColor} border-2`}>
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${config.gradient} px-6 py-8 text-center relative overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />

          <div className="relative flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm"
            >
              <Icon className="w-8 h-8 text-white" />
            </motion.div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">{title || config.title}</h2>
              <p className="text-white/90 text-sm max-w-md">
                {description || config.description}
              </p>
            </div>

            {errorCode && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Error Code: {errorCode}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error details */}
          {details && (
            <div className="rounded-lg bg-muted/50 p-4 border border-border/50">
              <div className="flex items-start gap-3">
                <Bug className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Technical Details</p>
                  <code className="text-xs text-foreground break-all font-mono bg-background px-2 py-1 rounded">
                    {details}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Support message */}
          {showSupport && (
            <div className={`rounded-lg ${config.bgColor} p-4 border ${config.borderColor}`}>
              <div className="flex items-start gap-3">
                <LifeBuoy className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">{config.supportMessage}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onRetry && (
              <Button
                onClick={onRetry}
                className="w-full sm:w-auto min-w-[140px]"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {retryLabel}
              </Button>
            )}

            {onGoBack && (
              <Button
                onClick={onGoBack}
                variant="outline"
                className="w-full sm:w-auto min-w-[140px]"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}

            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="ghost"
                className="w-full min-w-[140px]"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ErrorState;
