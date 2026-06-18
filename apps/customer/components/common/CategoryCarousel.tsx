// src/components/CategoryCarousel.tsx

"use client"; // Assuming Next.js App Router

import React, { useRef, useEffect, useState } from 'react';

// Continuous, seamless category carousel with updated styling
export const CategoryCarousel: React.FC<{ items: string[]; speed?: number }> = ({ items, speed = 40 }) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Measure width of one set (we render two copies)
  useEffect(() => {
    const measure = () => {
      if (contentRef.current) {
        // Content contains two copies; width of one copy is half
        setContentWidth(contentRef.current.offsetWidth / 2 || 0);
      }
    };

    // Use a timeout to ensure content has rendered before measuring
    const timer = setTimeout(measure, 100);
    window.addEventListener('resize', measure);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [items]);

  // Animation loop
  useEffect(() => {
    let last = performance.now();
    const step = (now: number) => {
      const delta = now - last;
      last = now;
      if (!isPaused && contentWidth > 0 && contentRef.current) {
        offsetRef.current += (speed * delta) / 1000; // Pixels per second
        if (offsetRef.current >= contentWidth) {
          offsetRef.current -= contentWidth;
        }
        contentRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [contentWidth, speed, isPaused]);

  return (
    <div
      className="w-full overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={contentRef}
        className="flex items-center gap-4 py-4 will-change-transform"
        style={{ transform: 'translateX(0)' }}
      >
        {/* We render the list twice for a seamless loop */}
        {Array.isArray(items) && items.concat(items).map((category, i) => (
          <div
            key={`${category}-${i}`}
            className="flex-shrink-0 whitespace-nowrap bg-muted py-2.5 px-6 rounded-lg cursor-pointer transition-colors hover:bg-muted/80"
          >
            <span className="text-sm font-medium text-muted-foreground">
              {category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};