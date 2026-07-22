'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type FontSize = 'sm' | 'normal' | 'lg' | 'xl';

interface FontSizeSliderProps {
  value: FontSize;
  onChange: (value: FontSize) => void;
  className?: string;
}

const fontSizes: { value: FontSize; label: string; size: string }[] = [
  { value: 'sm', label: 'Small', size: '14px' },
  { value: 'normal', label: 'Normal', size: '16px' },
  { value: 'lg', label: 'Large', size: '18px' },
  { value: 'xl', label: 'Extra Large', size: '20px' },
];

/**
 * Font size slider with live preview
 * Shows a slider with font size options and live text preview
 */
export function FontSizeSlider({ value, onChange, className }: FontSizeSliderProps) {
  const [localValue, setLocalValue] = useState<FontSize>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const currentIndex = fontSizes.findIndex((size) => size.value === localValue);
  const percentage = (currentIndex / (fontSizes.length - 1)) * 100;

  const handleChange = (newValue: FontSize) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const currentSize = fontSizes.find((size) => size.value === localValue)?.size || '16px';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Font Size</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Slider */}
        <div className="space-y-4">
          {/* Size Labels */}
          <div className="flex justify-between text-sm text-muted-foreground px-1">
            {fontSizes.map((size) => (
              <span
                key={size.value}
                className={cn(
                  'transition-colors',
                  localValue === size.value && 'text-foreground font-medium'
                )}
              >
                {size.label}
              </span>
            ))}
          </div>

          {/* Interactive Slider */}
          <div className="relative pt-1">
            <div className="h-2 bg-muted rounded-full relative">
              {/* Fill */}
              <div
                className="absolute h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${percentage}%` }}
              />
              {/* Thumb */}
              <button
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-primary rounded-full',
                  'border-2 border-background shadow-sm',
                  'hover:scale-110 active:scale-95 transition-transform',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  'cursor-pointer'
                )}
                style={{ left: `calc(${percentage}% - 10px)` }}
                onClick={(e) => {
                  const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                  if (!rect) return;
                  const x = e.clientX - rect.left;
                  const newPercentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                  const newIndex = Math.round((newPercentage / 100) * (fontSizes.length - 1));
                  handleChange(fontSizes[newIndex].value);
                }}
              >
                <span className="sr-only">Adjust font size</span>
              </button>
            </div>
          </div>

          {/* Size Indicators */}
          <div className="flex justify-between">
            {fontSizes.map((size, index) => (
              <button
                key={size.value}
                onClick={() => handleChange(size.value)}
                className={cn(
                  'w-3 h-3 rounded-full transition-all',
                  localValue === size.value
                    ? 'bg-primary scale-125'
                    : 'bg-muted hover:bg-muted-foreground/30'
                )}
                aria-label={`Set font size to ${size.label}`}
              />
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
          <p className="text-xs text-muted-foreground mb-2">Preview:</p>
          <p
            className="text-foreground leading-relaxed"
            style={{ fontSize: currentSize }}
          >
            The quick brown fox jumps over the lazy dog. Your dashboard text will
            look like this at the selected size.
          </p>
          <div className="mt-3 flex items-center gap-2 text-muted-foreground" style={{ fontSize: currentSize }}>
            <span>Aa</span>
            <span className="text-xs">Sample</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
