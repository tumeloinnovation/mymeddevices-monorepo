'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthChecklistProps {
  password: string;
  className?: string;
}

interface Requirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { id: 'length', label: '8+ characters', test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'Contains uppercase', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'Contains lowercase', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'Contains number', test: (p) => /[0-9]/.test(p) },
  { id: 'symbol', label: 'Contains symbol', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

/**
 * Password strength checklist with visual checkmarks
 * Shows each requirement with a green checkmark when met
 */
export function PasswordStrengthChecklist({ password, className }: PasswordStrengthChecklistProps) {
  const metCount = requirements.filter((req) => req.test(password)).length;
  const totalCount = requirements.length;
  const strength = metCount / totalCount;

  // Strength level for color coding
  const strengthLevel = strength < 0.4 ? 'weak' : strength < 0.8 ? 'medium' : 'strong';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress bar */}
      <div className="flex gap-1 mb-2">
        {requirements.map((req, index) => {
          const isMet = req.test(password);
          const isCurrentLevel = index < metCount;

          return (
            <div
              key={req.id}
              className={cn(
                'h-1 flex-1 rounded transition-colors duration-200',
                isMet
                  ? strengthLevel === 'weak'
                    ? 'bg-red-500'
                    : strengthLevel === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
          );
        })}
      </div>

      {/* Checklist items */}
      <div className="space-y-1.5">
        {requirements.map((req) => {
          const isMet = req.test(password);

          return (
            <div
              key={req.id}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors duration-200',
                isMet ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0 w-4 h-4 rounded-full border transition-all duration-200',
                  isMet
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 dark:border-gray-600'
                )}
              >
                {isMet && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className={cn(isMet && 'font-medium')}>{req.label}</span>
            </div>
          );
        })}
      </div>

      {/* Strength text */}
      <p className="text-xs text-muted-foreground">
        {password.length === 0
          ? 'Enter a password to see strength'
          : strengthLevel === 'weak'
            ? 'Weak password - add more requirements'
            : strengthLevel === 'medium'
              ? 'Medium strength - almost there'
              : 'Strong password - good to go!'}
      </p>
    </div>
  );
}

/**
 * Get overall strength level for external use
 */
export function getPasswordStrengthLevel(password: string): 'weak' | 'medium' | 'strong' | '' {
  if (!password) return '';

  const requirements: Requirement[] = [
    { id: 'length', label: '8+ characters', test: (p) => p.length >= 8 },
    { id: 'uppercase', label: 'Contains uppercase', test: (p) => /[A-Z]/.test(p) },
    { id: 'lowercase', label: 'Contains lowercase', test: (p) => /[a-z]/.test(p) },
    { id: 'number', label: 'Contains number', test: (p) => /[0-9]/.test(p) },
    { id: 'symbol', label: 'Contains symbol', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
  ];

  const metCount = requirements.filter((req) => req.test(password)).length;
  const strength = metCount / requirements.length;

  if (strength < 0.4) return 'weak';
  if (strength < 0.8) return 'medium';
  return 'strong';
}
