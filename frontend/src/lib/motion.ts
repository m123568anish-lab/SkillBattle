/**
 * Qubira Black Edition — Motion Design Tokens
 * Centralized durations, easings, and Framer Motion variants.
 * Follows technical, minimal, developer-command-center art direction.
 */

export const MOTION_DURATIONS = {
  fast: 0.15, // 150ms - micro-interactions, button presses, tooltips
  normal: 0.25, // 250ms - dropdowns, panel slides, tab switches
  slow: 0.4, // 400ms - modal entrances, large layout transitions
  ambient: 12, // 12s - slow ambient breathing/grid drift
} as const;

export const MOTION_EASINGS = {
  // Snappy, authoritative developer command center curve
  command: [0.16, 1, 0.3, 1] as const,
  // Standard natural deceleration
  standard: [0.4, 0, 0.2, 1] as const,
  // Subtle tactile bounce for buttons and toggles
  spring: [0.34, 1.56, 0.64, 1] as const,
  // Deceleration curve for entering elements
  easeOut: [0, 0, 0.2, 1] as const,
  // Acceleration curve for exiting elements
  easeIn: [0.4, 0, 1, 1] as const,
} as const;

export const SPRING_PRESETS = {
  snappy: { type: "spring", damping: 28, stiffness: 320 } as const,
  gentle: { type: "spring", damping: 32, stiffness: 220 } as const,
  drawer: { type: "spring", damping: 26, stiffness: 260 } as const,
} as const;

/**
 * Standard Framer Motion variants
 */

export const fadeInUpVariant = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.command,
    },
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.easeIn,
    },
  },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const dropdownScaleVariant = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.command,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -4,
    transition: {
      duration: MOTION_DURATIONS.fast * 0.8,
      ease: MOTION_EASINGS.easeIn,
    },
  },
};

export const modalBackdropVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: MOTION_DURATIONS.fast },
  },
  exit: {
    opacity: 0,
    transition: { duration: MOTION_DURATIONS.fast },
  },
};
