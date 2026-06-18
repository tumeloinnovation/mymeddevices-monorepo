"use client";
import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface LoadingStateProps {
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = "Loading",
  description = "Please wait while we load content.",
  size = "md",
}) => {
  const height = size === "sm" ? "h-28" : size === "lg" ? "h-48" : "h-36";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full flex items-center justify-center ${height}`}
    >
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-2 text-xs text-muted-foreground">Fetching latest data...</div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LoadingState;
