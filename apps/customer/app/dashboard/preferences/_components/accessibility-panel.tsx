'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, Palette, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'sm' | 'normal' | 'lg' | 'xl';
}

interface AccessibilityPanelProps {
  settings: AccessibilitySettings;
  onSettingsChange: (settings: AccessibilitySettings) => void;
  onSave?: (settings: AccessibilitySettings) => Promise<void>;
  className?: string;
}

/**
 * Accessibility settings panel with instant preview and auto-save
 * Changes apply immediately to the page and auto-save after a delay
 */
export function AccessibilityPanel({
  settings,
  onSettingsChange,
  onSave,
  className,
}: AccessibilityPanelProps) {
  const [localSettings, setLocalSettings] = useState<AccessibilitySettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Apply settings instantly to document
  useEffect(() => {
    const root = document.documentElement;

    // Apply reduced motion
    if (localSettings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      // Add class to global body
      document.body.classList.add('reduced-motion');
    } else {
      root.style.removeProperty('--animation-duration');
      document.body.classList.remove('reduced-motion');
    }

    // Apply high contrast
    if (localSettings.highContrast) {
      document.body.classList.add('high-contrast');
      root.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
      root.classList.remove('high-contrast');
    }

    // Apply font size
    root.style.setProperty('--font-size-base', getFontSizeValue(localSettings.fontSize));
  }, [localSettings]);

  // Auto-save with debounce
  useEffect(() => {
    if (!onSave) return;

    const timeoutId = setTimeout(async () => {
      if (saveStatus === 'idle') {
        setIsSaving(true);
        setSaveStatus('saving');

        try {
          await onSave(localSettings);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
          toast.error('Failed to save accessibility settings');
          setSaveStatus('idle');
        } finally {
          setIsSaving(false);
        }
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [localSettings, onSave, saveStatus]);

  const handleToggle = useCallback((key: keyof AccessibilitySettings, value: boolean) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    onSettingsChange({ ...localSettings, [key]: value });
  }, [localSettings, onSettingsChange]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              Accessibility
            </CardTitle>
            <CardDescription>
              Customize your viewing experience. Changes apply instantly.
            </CardDescription>
          </div>
          {saveStatus !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'text-xs font-medium px-2 py-1 rounded',
                saveStatus === 'saved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              )}
            >
              {saveStatus === 'saved' ? '✓ Saved' : 'Saving...'}
            </motion.div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reduced Motion */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="reduced-motion" className="flex items-center gap-2 cursor-pointer">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Reduced Motion
            </Label>
            <p className="text-sm text-muted-foreground">
              Minimizes animations throughout the app for comfort and accessibility
            </p>
          </div>
          <Switch
            id="reduced-motion"
            checked={localSettings.reducedMotion}
            onCheckedChange={(checked) => handleToggle('reducedMotion', checked)}
          />
        </div>

        {/* High Contrast */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="high-contrast" className="flex items-center gap-2 cursor-pointer">
              <Palette className="h-4 w-4 text-muted-foreground" />
              High Contrast
            </Label>
            <p className="text-sm text-muted-foreground">
              Increases color contrast for better visibility
            </p>
          </div>
          <Switch
            id="high-contrast"
            checked={localSettings.highContrast}
            onCheckedChange={(checked) => handleToggle('highContrast', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function getFontSizeValue(size: AccessibilitySettings['fontSize']): string {
  switch (size) {
    case 'sm':
      return '14px';
    case 'normal':
      return '16px';
    case 'lg':
      return '18px';
    case 'xl':
      return '20px';
  }
}
