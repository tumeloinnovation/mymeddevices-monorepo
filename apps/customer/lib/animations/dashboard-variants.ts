/**
 * Shared animation variants for dashboard pages
 * Based on Emil Kowalski principles:
 * - Never animate from scale(0) - always start from scale(0.95) minimum
 * - Never use ease-in for UI animations
 * - Keep all UI animations under 300ms
 * - Use cubic-bezier(0.23, 1, 0.32, 1) for natural feel
 */

import { Variants } from 'framer-motion';

// ============================================================================
// PAGE & SECTION ANIMATIONS
// ============================================================================

/**
 * Page entry animation - fades in and slides up slightly
 * Duration: 300ms
 */
export const pageEntry: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

/**
 * Staggered children animation for list items, cards, etc.
 * Staggers children by 40ms
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

/**
 * Individual item animation for staggered lists
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

// ============================================================================
// CARD ANIMATIONS
// ============================================================================

/**
 * Card entry animation - scales up slightly and fades in
 * Never uses scale(0) - starts from scale(0.95)
 */
export const cardEntry: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

/**
 * Card exit animation for delete/remove actions
 * Collapses height and scales down
 */
export const cardExit: Variants = {
  exit: {
    opacity: 0,
    scale: 0.95,
    height: 0,
    marginTop: 0,
    marginBottom: 0,
    transition: {
      duration: 0.2,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

// ============================================================================
// MODAL & SHEET ANIMATIONS
// ============================================================================

/**
 * Modal/Sheet enter animation
 * Scales from 0.95 (not 0) and fades in
 */
export const modalEnter: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

/**
 * Modal/Sheet exit animation
 */
export const modalExit: Variants = {
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

// ============================================================================
// BUTTON & INTERACTION ANIMATIONS
// ============================================================================

/**
 * Button press animation - quick scale down
 * Duration: 160ms
 */
export const buttonPress = {
  tap: { scale: 0.97 },
  hover: { scale: 1.02 },
};

/**
 * Toggle switch animation
 * Duration: 200ms
 */
export const toggleSwitch = {
  checked: { scale: 1.1 },
  unchecked: { scale: 1 },
};

// ============================================================================
// SPECIALIZED ANIMATIONS
// ============================================================================

/**
 * Slide from right animation (for sidebars, sheets from right)
 */
export const slideFromRight: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

/**
 * Slide from bottom animation (for sheets from bottom)
 */
export const slideFromBottom: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

/**
 * Warning/alert banner animation - slides down from top
 */
export const bannerEnter: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.23, 1, 0.32, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.15,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

/**
 * Skeleton to content crossfade
 * For smooth transitions from loading to content
 */
export const skeletonCrossfade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
};

// ============================================================================
// PRESET COMBINATIONS
// ============================================================================

/**
 * Default animation preset for most dashboard pages
 * Combines page entry with staggered children
 */
export const defaultPageAnimation: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1],
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

/**
 * Quick preset for simple cards
 */
export const quickCardEntry = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};
