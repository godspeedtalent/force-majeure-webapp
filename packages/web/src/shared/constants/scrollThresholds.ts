/**
 * Scroll-based animation thresholds
 */
export const SCROLL_THRESHOLDS = {
  /** Threshold for content fade on index page */
  CONTENT_FADE: 400,
  /** Threshold for floating button fade on index page */
  FLOATING_BUTTON_FADE: 200,
  /** Threshold for navigation scroll state */
  NAV_SCROLL: 50,
  /** Parallax scroll multiplier */
  PARALLAX_MULTIPLIER: 0.5,
  /** Mobile parallax scroll multiplier (reduced for performance) */
  MOBILE_PARALLAX_MULTIPLIER: 0.2,
  /** Scroll snap transition duration in ms */
  SNAP_TRANSITION_DURATION: 300,
  /** Section snap threshold (percentage of viewport) */
  SECTION_SNAP_THRESHOLD: 0.5,
  /** Delay before showing scroll cue on mobile */
  SCROLL_CUE_DELAY: 2000,
  /** Duration to show section snap feedback */
  SNAP_FEEDBACK_DURATION: 200,
} as const;
