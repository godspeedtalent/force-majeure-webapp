/**
 * Mobile layout constants for coordinated bottom spacing
 * Used to calculate proper padding that accounts for fixed UI elements
 */

/**
 * Heights of fixed elements at the bottom of mobile screens
 * All values in pixels
 */
export const MOBILE_BOTTOM_ELEMENTS = {
  /** Auto-scroll progress bar height */
  progressBar: 3,
  /** Space between progress bar and swipe indicator */
  indicatorPadding: 20,
  /** Swipe indicator pill height including internal padding */
  indicator: 50,
  /** Extra breathing room above all elements */
  contentBuffer: 20,
} as const;

/**
 * Total bottom offset needed for mobile content
 * Sum of all bottom element heights: 131px
 * This replaces the old hardcoded 180px padding
 */
export const MOBILE_CONTENT_BOTTOM_OFFSET = Object.values(
  MOBILE_BOTTOM_ELEMENTS
).reduce((a, b) => a + b, 0);

/**
 * CSS variable names for mobile layout
 */
export const MOBILE_CSS_VARS = {
  /** Base bottom offset without safe area */
  bottomOffset: '--mobile-bottom-offset',
  /** Bottom offset including safe area inset */
  bottomSafe: '--mobile-bottom-safe',
} as const;

/**
 * Helper to get the CSS calc value for bottom padding
 * Includes safe area inset for notched devices
 * @param additionalPadding - Extra padding to add (default: 20px for content margin)
 */
export const getMobileBottomPadding = (additionalPadding = 20): string =>
  `calc(var(${MOBILE_CSS_VARS.bottomSafe}, ${MOBILE_CONTENT_BOTTOM_OFFSET}px) + ${additionalPadding}px)`;

/**
 * Helper to get safe-area-aware bottom position for fixed elements
 * @param baseOffset - Base offset from bottom in pixels
 */
export const getMobileSafeBottomPosition = (baseOffset: number): string =>
  `calc(env(safe-area-inset-bottom, 0px) + ${baseOffset}px)`;
