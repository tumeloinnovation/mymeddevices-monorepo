/**
 * Authentication theme utilities for customer app
 * - Orange/amber theme for both login and registration
 */

export const AUTH_COLORS = {
  // Dominant application palette (#e0752b vibrant orange)
  primary: '#e0752b',
  primaryLight: 'bg-[#e0752b]/10',
  primaryMedium: 'bg-[#e0752b]',
  primaryDark: 'bg-[#c86221]',
  accent: 'bg-[#a5c5c6]',
  accentLight: 'bg-[#a5c5c6]/20',
  accentDark: 'bg-[#0e599b]',

  // Gradient definitions
  bgGradient: 'from-[#e0752b] to-[#0e599b]',
  headerGradient: 'from-[#e0752b] via-[#d66620] to-[#0e599b]',

  // Status colors
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
} as const;

export const AUTH_STYLES = {
  // Icon containers
  iconContainer: 'w-11 h-11 rounded-2xl bg-[#e0752b]/10 border border-[#e0752b]/20 flex items-center justify-center',
  iconContainerAccent: 'w-11 h-11 rounded-2xl bg-[#a5c5c6]/20 border border-[#a5c5c6]/40 flex items-center justify-center',

  // Progress indicators
  progressActive: 'bg-[#e0752b]',
  progressInactive: 'bg-muted/80',
  progressComplete: 'bg-emerald-500 text-white',

  // Buttons
  buttonPrimary: 'bg-[#e0752b] hover:bg-[#c86221] text-white shadow-md transition-all active:scale-[0.98]',
  buttonAccent: 'bg-[#0e599b] hover:bg-[#0b487e] text-white shadow-md transition-all active:scale-[0.98]',
  buttonGhost: 'hover:bg-[#e0752b]/10 text-[#e0752b]',

  // Input focus states
  inputFocus: 'focus:border-[#e0752b] focus:ring-[#e0752b]/20',
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
