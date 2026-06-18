"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Section({ index, activeIndex, title, subtitle, children, onEdit }: any) {
  const isActive = index === activeIndex;
  return (
    <div data-step-index={index} className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {index + 1}
            </div>
            <div>
              <div className="text-base font-medium">{title}</div>
              <div className="text-sm text-muted-foreground">{subtitle}</div>
            </div>
          </div>
        </div>
        <div>
          <button
            onClick={onEdit}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Edit
          </button>
        </div>
      </div>

      <AnimatePresence initial={false} mode="wait">
        {isActive && (
          <motion.div
            key={`panel-${index}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ ease: "easeInOut", duration: 0.22 }}
            className="mt-6"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Section;
