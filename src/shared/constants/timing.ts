/**
 * Centralized timing constants for animations, delays, and durations
 * Use these instead of hardcoded values throughout the application
 */

export const TIMING = {
  // Animation durations
  ANIMATION_INSTANT: 100,
  ANIMATION_FAST: 150,
  ANIMATION_DEFAULT: 200,
  ANIMATION_MEDIUM: 300,
  ANIMATION_SLOW: 500,

  // Transition durations
  TRANSITION_FAST: 150,
  TRANSITION_DEFAULT: 200,
  TRANSITION_MEDIUM: 300,
  TRANSITION_SLOW: 400,

  // Debounce delays
  DEBOUNCE_INSTANT: 100,
  DEBOUNCE_FAST: 150,
  DEBOUNCE_DEFAULT: 300,
  DEBOUNCE_SLOW: 500,

  // Press/hold delays
  PRESS_DELAY_SHORT: 150,
  PRESS_DELAY_DEFAULT: 300,
  PRESS_DELAY_LONG: 500,

  // Toast durations
  TOAST_SHORT: 2000,
  TOAST_DEFAULT: 4000,
  TOAST_LONG: 6000,

  // Hover delays
  HOVER_DELAY_TOOLTIP: 300,
  HOVER_DELAY_DROPDOWN: 200,
  HOVER_DELAY_LONG: 1000,

  // Polling intervals
  POLL_FAST: 1000,
  POLL_DEFAULT: 5000,
  POLL_SLOW: 30000,

  // Auto-save/refresh intervals
  AUTO_SAVE_DELAY: 1000,
  AUTO_REFRESH_DEFAULT: 30000,

  // Session/timeout durations (in milliseconds)
  SESSION_WARNING: 5 * 60 * 1000, // 5 minutes before expiry
  CHECKOUT_TIMEOUT: 10 * 60 * 1000, // 10 minutes for checkout
} as const;

// Type for accessing TIMING values
export type TimingKey = keyof typeof TIMING;
export type TimingValue = (typeof TIMING)[TimingKey];

// Helper for CSS duration strings
export const toCssDuration = (ms: number): string => `${ms}ms`;

// Common CSS duration values
export const CSS_TIMING = {
  ANIMATION_FAST: toCssDuration(TIMING.ANIMATION_FAST),
  ANIMATION_DEFAULT: toCssDuration(TIMING.ANIMATION_DEFAULT),
  ANIMATION_MEDIUM: toCssDuration(TIMING.ANIMATION_MEDIUM),
  ANIMATION_SLOW: toCssDuration(TIMING.ANIMATION_SLOW),
  TRANSITION_DEFAULT: toCssDuration(TIMING.TRANSITION_DEFAULT),
  TRANSITION_MEDIUM: toCssDuration(TIMING.TRANSITION_MEDIUM),
} as const;
