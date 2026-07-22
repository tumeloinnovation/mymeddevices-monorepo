'use client';

import { Shield, Check, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SecurityScoreWidgetProps {
  className?: string;
}

interface SecurityFactor {
  id: string;
  label: string;
  met: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Security Score Widget
 * Shows an overall security score (0-5) with visual progress and individual factors
 */
export function SecurityScoreWidget({ className }: SecurityScoreWidgetProps) {
  // TODO: In a real implementation, these would come from API data
  // For now, we'll show example data
  const securityFactors: SecurityFactor[] = [
    { id: 'password', label: 'Strong password', met: true },
    { id: 'emailAlerts', label: 'Email alerts enabled', met: true },
    { id: 'sessions', label: '1 active session', met: true },
    { id: '2fa', label: '2FA enabled', met: false },
    { id: 'passwordAge', label: 'Password changed recently', met: false },
  ];

  const metCount = securityFactors.filter((f) => f.met).length;
  const totalCount = securityFactors.length;
  const score = metCount; // Score out of 5
  const percentage = (metCount / totalCount) * 100;

  // Score level for styling
  const scoreLevel = score <= 2 ? 'low' : score <= 3 ? 'medium' : 'high';

  return (
    <Card
      className={cn(
        'bg-gradient-to-br from-green-50/40 to-transparent dark:from-green-950/10',
        scoreLevel === 'low' && 'from-amber-50/40 dark:from-amber-950/10',
        scoreLevel === 'medium' && 'from-blue-50/40 dark:from-blue-950/10',
        scoreLevel === 'high' && 'from-green-50/40 dark:from-green-950/10',
        'border-green-100 dark:border-green-900/30',
        scoreLevel === 'low' && 'border-amber-100 dark:border-amber-900/30',
        scoreLevel === 'medium' && 'border-blue-100 dark:border-blue-900/30',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Animated Shield Icon */}
          <motion.div
            className={cn(
              'p-3 rounded-lg',
              scoreLevel === 'high'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : scoreLevel === 'medium'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
            )}
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <Shield className="h-6 w-6" />
          </motion.div>

          <div className="flex-1 space-y-4">
            {/* Score Header */}
            <div>
              <h2
                className={cn(
                  'text-base font-semibold',
                  scoreLevel === 'high'
                    ? 'text-green-900 dark:text-green-300'
                    : scoreLevel === 'medium'
                      ? 'text-blue-900 dark:text-blue-300'
                      : 'text-amber-900 dark:text-amber-300'
                )}
              >
                🛡️ Security Score: {score}/{totalCount}
              </h2>
              <p
                className={cn(
                  'text-sm mt-1',
                  scoreLevel === 'high'
                    ? 'text-green-700/80 dark:text-green-400/80'
                    : scoreLevel === 'medium'
                      ? 'text-blue-700/80 dark:text-blue-400/80'
                      : 'text-amber-700/80 dark:text-amber-400/80'
                )}
              >
                {score === totalCount
                  ? 'Excellent! Your account is fully secured.'
                  : score >= totalCount - 1
                    ? 'Very good! Consider enabling 2FA for maximum security.'
                    : score >= totalCount - 2
                      ? 'Good security. A few improvements recommended.'
                      : 'Your account needs attention. Please improve security settings.'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex gap-1">
                {Array.from({ length: totalCount }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      'h-2 flex-1 rounded-full transition-all duration-500',
                      index < metCount
                        ? scoreLevel === 'high'
                          ? 'bg-green-500'
                          : scoreLevel === 'medium'
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{Math.round(percentage)}% complete</p>
            </div>

            {/* Security Factors */}
            <div className="space-y-2">
              {securityFactors.map((factor) => (
                <div
                  key={factor.id}
                  className={cn(
                    'flex items-center gap-2 text-sm',
                    factor.met ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'
                  )}
                >
                  {factor.met ? (
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                  )}
                  <span className={factor.met ? 'font-medium' : ''}>{factor.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
