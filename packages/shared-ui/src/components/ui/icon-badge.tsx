"use client";
import { motion } from "framer-motion";

interface IconBadgeProps {
  count: number;
  color?: "primary" | "secondary" | "danger";
}

export const IconBadge = ({ count, color = "primary" }: IconBadgeProps) => {
  if (count <= 0) return null;

  const colorMap = {
    primary: "bg-primary text-white",
    secondary: "bg-muted text-foreground",
    danger: "bg-destructive text-white",
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center ${colorMap[color]}`}
    >
      {count}
    </motion.div>
  );
};
