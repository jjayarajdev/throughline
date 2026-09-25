/** Shared animation presets for consistent timing across the app. */
export const DURATIONS = {
  fast: 0.15,    // Button hover/tap, focus glow
  normal: 0.2,   // Card hover, dialog entrance
  slow: 0.3,     // Page-level transitions (avoid exceeding this)
} as const;

export const TRANSITIONS = {
  /** Snappy for interactive elements (buttons, toggles). */
  snappy: { duration: DURATIONS.fast, ease: 'easeOut' as const },
  /** Smooth for entrance/exit animations (dialogs, sheets). */
  smooth: { duration: DURATIONS.normal, ease: [0.16, 1, 0.3, 1] as const },
  /** Spring for playful interactions (notification bell bounce). */
  spring: { type: 'spring' as const, stiffness: 400, damping: 25 },
} as const;

/** Stagger config for list animations (notifications, stat cards). */
export const STAGGER = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  },
  item: {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 },
  },
} as const;
