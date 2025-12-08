/**
 * Force Majeure Design Tokens
 *
 * Platform-agnostic design tokens that can be shared between web and mobile.
 * These are the primitive values that define the design system.
 *
 * Web: Import these and use with Tailwind or CSS-in-JS
 * Mobile: Import these and use with Tamagui, StyleSheet, or NativeWind
 *
 * @example Web usage:
 * ```typescript
 * import { FM_COLORS, FM_SPACING } from '@force-majeure/shared/design/tokens';
 * // Use in inline styles or CSS-in-JS
 * ```
 *
 * @example Mobile (Tamagui) usage:
 * ```typescript
 * import { FM_COLORS, FM_SPACING } from '@force-majeure/shared/design/tokens';
 * import { createTokens } from 'tamagui';
 *
 * const tokens = createTokens({
 *   color: FM_COLORS,
 *   space: FM_SPACING,
 * });
 * ```
 */

// =============================================================================
// COLOR TOKENS
// =============================================================================

/**
 * Primary color palette values.
 * These are raw hex values that can be used on any platform.
 */
export const FM_COLORS = {
  // Base Colors
  black: '#000000',
  white: '#FFFFFF',

  // Brand Colors
  gold: '#dfba7d', // Primary accent - buttons, highlights, CTAs
  crimson: '#520C10', // Secondary accent - subtle emphasis
  navy: '#545E75', // Tertiary - informational states
  danger: '#D64933', // Errors, warnings, destructive actions

  // Semantic aliases
  primary: '#dfba7d', // Alias for gold
  secondary: '#520C10', // Alias for crimson
  info: '#545E75', // Alias for navy
  error: '#D64933', // Alias for danger

  // Background variants
  background: '#000000',
  foreground: '#FFFFFF',

  // Muted/subdued variants
  mutedForeground: 'rgba(255, 255, 255, 0.6)',
  mutedBackground: 'rgba(0, 0, 0, 0.6)',

  // Transparent overlays
  overlay: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    dark: 'rgba(0, 0, 0, 0.6)',
  },

  // Gold with alpha variants (for hover/focus states)
  goldAlpha: {
    10: 'rgba(223, 186, 125, 0.1)',
    15: 'rgba(223, 186, 125, 0.15)',
    20: 'rgba(223, 186, 125, 0.2)',
    30: 'rgba(223, 186, 125, 0.3)',
    50: 'rgba(223, 186, 125, 0.5)',
  },

  // White with alpha variants
  whiteAlpha: {
    5: 'rgba(255, 255, 255, 0.05)',
    10: 'rgba(255, 255, 255, 0.1)',
    20: 'rgba(255, 255, 255, 0.2)',
    40: 'rgba(255, 255, 255, 0.4)',
    60: 'rgba(255, 255, 255, 0.6)',
  },

  // Black with alpha variants (for depth levels)
  blackAlpha: {
    40: 'rgba(0, 0, 0, 0.4)',
    60: 'rgba(0, 0, 0, 0.6)',
    70: 'rgba(0, 0, 0, 0.7)',
    80: 'rgba(0, 0, 0, 0.8)',
  },
} as const;

// =============================================================================
// SPACING TOKENS
// =============================================================================

/**
 * Spacing scale in pixels.
 * Based on 5px increments for consistent spacing.
 */
export const FM_SPACING = {
  xs: 5,
  sm: 10,
  md: 20,
  lg: 40,
  xl: 60,

  // Additional granular values
  0: 0,
  1: 5,
  2: 10,
  3: 15,
  4: 20,
  5: 25,
  6: 30,
  8: 40,
  10: 50,
  12: 60,
} as const;

/**
 * Spacing as CSS strings (for web compatibility)
 */
export const FM_SPACING_PX = {
  xs: '5px',
  sm: '10px',
  md: '20px',
  lg: '40px',
  xl: '60px',
} as const;

// =============================================================================
// TYPOGRAPHY TOKENS
// =============================================================================

/**
 * Font family definitions.
 */
export const FM_FONTS = {
  primary: 'Canela',
  fallback: 'Georgia, serif',
  full: 'Canela, Georgia, serif',

  // For mobile - these would map to custom fonts
  heading: 'Canela',
  body: 'Canela',
} as const;

/**
 * Font weight values.
 */
export const FM_FONT_WEIGHTS = {
  normal: '400',
  medium: '500',
  bold: '700',
} as const;

/**
 * Font size scale (in pixels).
 */
export const FM_FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

/**
 * Line height scale.
 */
export const FM_LINE_HEIGHTS = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// =============================================================================
// BORDER TOKENS
// =============================================================================

/**
 * Border radius values.
 * Note: Force Majeure design uses sharp corners by default.
 */
export const FM_RADII = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  full: 9999,
} as const;

/**
 * Border width values.
 */
export const FM_BORDER_WIDTHS = {
  none: 0,
  thin: 1,
  medium: 2,
  thick: 3,
} as const;

// =============================================================================
// SHADOW TOKENS
// =============================================================================

/**
 * Box shadow definitions.
 * These are CSS shadow strings for web; mobile would use platform-specific shadows.
 */
export const FM_SHADOWS = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',

  // Gold glow shadows (for focus/hover states)
  goldGlow: {
    subtle: '0 0 12px rgba(223, 186, 125, 0.15)',
    medium: '0 4px 16px rgba(223, 186, 125, 0.3)',
    strong: '0 8px 24px rgba(223, 186, 125, 0.4)',
  },

  // Component-specific shadows
  card: '0 4px 6px rgba(0, 0, 0, 0.1)',
  dropdown: '0 10px 15px rgba(0, 0, 0, 0.1)',
  modal: '0 25px 50px rgba(0, 0, 0, 0.25)',
} as const;

// =============================================================================
// ANIMATION TOKENS
// =============================================================================

/**
 * Animation duration values (in milliseconds).
 */
export const FM_DURATIONS = {
  instant: 0,
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

/**
 * Animation easing functions.
 */
export const FM_EASINGS = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  // Custom cubic-bezier curves
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// =============================================================================
// Z-INDEX TOKENS
// =============================================================================

/**
 * Z-index scale for layering.
 */
export const FM_Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
  toast: 70,
} as const;

// =============================================================================
// DEPTH SYSTEM
// =============================================================================

/**
 * Depth levels for the frosted glass effect.
 * Each level represents a layer in the visual hierarchy.
 */
export const FM_DEPTH = {
  level0: {
    background: 'transparent',
    border: FM_COLORS.whiteAlpha[20],
    blur: 0,
  },
  level1: {
    background: FM_COLORS.blackAlpha[60],
    border: FM_COLORS.whiteAlpha[10],
    blur: 4, // backdrop-blur-sm
  },
  level2: {
    background: FM_COLORS.blackAlpha[70],
    border: FM_COLORS.whiteAlpha[10],
    blur: 12, // backdrop-blur-md
  },
  level3: {
    background: FM_COLORS.blackAlpha[80],
    border: FM_COLORS.whiteAlpha[20],
    blur: 16, // backdrop-blur-lg
  },
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

/**
 * Responsive breakpoints (in pixels).
 */
export const FM_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type FMColor = keyof typeof FM_COLORS;
export type FMSpacing = keyof typeof FM_SPACING;
export type FMFontSize = keyof typeof FM_FONT_SIZES;
export type FMFontWeight = keyof typeof FM_FONT_WEIGHTS;
export type FMRadius = keyof typeof FM_RADII;
export type FMShadow = keyof typeof FM_SHADOWS;
export type FMDuration = keyof typeof FM_DURATIONS;
export type FMZIndex = keyof typeof FM_Z_INDEX;
export type FMDepthLevel = keyof typeof FM_DEPTH;
export type FMBreakpoint = keyof typeof FM_BREAKPOINTS;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a color value by key.
 */
export function getColor(key: string): string {
  const parts = key.split('.');
  let value: any = FM_COLORS;

  for (const part of parts) {
    value = value?.[part];
  }

  return typeof value === 'string' ? value : FM_COLORS.black;
}

/**
 * Get a spacing value by key.
 */
export function getSpacing(key: keyof typeof FM_SPACING): number {
  return FM_SPACING[key];
}

/**
 * Get a spacing value as a CSS string.
 */
export function getSpacingPx(key: keyof typeof FM_SPACING_PX): string {
  return FM_SPACING_PX[key];
}
