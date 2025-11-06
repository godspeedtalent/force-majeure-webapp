/**
 * Color configuration for Tailwind CSS
 * Centralized color palette with semantic naming
 */

// Base semantic colors using CSS variables
const semanticColors = {
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
};

// Generate color variants with consistent structure
const createColorVariant = (varName: string) => ({
  DEFAULT: `hsl(var(--${varName}))`,
  foreground: `hsl(var(--${varName}-foreground))`,
});

// UI component colors
const componentColors = {
  primary: createColorVariant('primary'),
  secondary: createColorVariant('secondary'),
  destructive: createColorVariant('destructive'),
  muted: createColorVariant('muted'),
  accent: createColorVariant('accent'),
  popover: createColorVariant('popover'),
  card: createColorVariant('card'),
};

// Force Majeure brand colors
// Based on design system: /src/shared/constants/designSystem.ts
const brandColors = {
  // Primary accent - Dusty Gold
  'fm-gold': '#dfba7d',
  
  // Secondary - Dark Crimson
  'fm-crimson': '#520C10',
  
  // Info/Tertiary - Muted Navy
  'fm-navy': '#545E75',
  
  // Danger - Chili Red (brighter than crimson)
  'fm-danger': '#D64933',
  
  // Legacy colors (can be deprecated if not in use)
  'fm-charcoal': 'hsl(var(--fm-charcoal))',
  'fm-silver': 'hsl(var(--fm-silver))',
};

export const colors = {
  ...semanticColors,
  ...componentColors,
  ...brandColors,
};
