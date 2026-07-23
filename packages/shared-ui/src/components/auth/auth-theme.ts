/**
 * Authentication theme utilities for customer app
 * - Orange/amber theme for both login and registration
 */

export const AUTH_COLORS = {
  // Primary colors (orange theme)
  primary: 'oklch(0.6875 0.1583 41.3590)',
  primaryLight: 'bg-orange-400',
  primaryMedium: 'bg-orange-500',
  primaryDark: 'bg-orange-600',
  accent: 'bg-amber-400',
  accentLight: 'bg-amber-300',
  accentDark: 'bg-amber-600',

  // Gradient definitions
  bgGradient: 'from-orange-900 via-amber-950 to-yellow-950',
  headerGradient: 'from-orange-600 to-amber-600',

  // Status colors
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
} as const;

export const AUTH_STYLES = {
  // Icon containers
  iconContainer: 'w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center',
  iconContainerAccent: 'w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center',

  // Progress indicators
  progressActive: 'bg-orange-600',
  progressInactive: 'bg-orange-200 dark:bg-orange-800',
  progressComplete: 'bg-amber-400',

  // Buttons
  buttonPrimary: 'bg-orange-600 hover:bg-orange-700 text-white',
  buttonAccent: 'bg-amber-500 hover:bg-amber-600 text-white',
  buttonGhost: 'hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400',

  // Input focus states
  inputFocus: 'focus:border-orange-500 focus:ring-orange-500/20',
} as const;

// Helper functions for conditional styling
export const getStepStatusColor = (
  status: 'pending' | 'active' | 'complete'
): string => {
  const styles = {
    complete: AUTH_STYLES.progressComplete,
    active: AUTH_STYLES.progressActive,
    pending: AUTH_STYLES.progressInactive,
  };

  return styles[status] || styles.pending;
};

export const getIconBgClass = (accent = false): string => {
  return accent ? AUTH_STYLES.iconContainerAccent : AUTH_STYLES.iconContainer;
};

export const getIconColor = (accent = false): string => {
  return accent ? 'text-amber-600' : 'text-orange-600';
};

export const getButtonClass = (accent = false): string => {
  return accent ? AUTH_STYLES.buttonAccent : AUTH_STYLES.buttonPrimary;
};
