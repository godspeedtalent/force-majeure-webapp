/**
 * Force Majeure Design System Constants
 *
 * Central source of truth for colors, spacing, typography, and design tokens.
 * Use these constants throughout the application for consistency.
 *
 * @see /docs/DESIGN_SYSTEM.md for complete design guidelines
 */

/**
 * Color Palette
 *
 * Primary colors used throughout the application.
 * Black and white form the base, with gold as primary accent.
 */
export const COLORS = {
  // Base Colors
  BLACK: '#000000',
  WHITE: '#FFFFFF',

  // Accent Colors
  DUSTY_GOLD: '#dfba7d', // Primary accent - buttons, highlights, CTAs
  DARK_CRIMSON: '#520C10', // Secondary accent - subtle emphasis

  // Semantic Colors
  MUTED_NAVY: '#545E75', // Info/tertiary - informational states
  CHILI_RED: '#D64933', // Danger - errors, warnings, destructive actions
} as const;

/**
 * Tailwind CSS class mappings for colors
 * Use these for consistency with Tailwind configuration
 */
export const COLOR_CLASSES = {
  // Dusty Gold (Primary Accent)
  GOLD_BG: 'bg-fm-gold',
  GOLD_TEXT: 'text-fm-gold',
  GOLD_BORDER: 'border-fm-gold',
  GOLD_HOVER_BG: 'hover:bg-fm-gold',
  GOLD_HOVER_TEXT: 'hover:text-fm-gold',

  // Dark Crimson (Secondary)
  CRIMSON_BG: 'bg-fm-crimson',
  CRIMSON_TEXT: 'text-fm-crimson',
  CRIMSON_BORDER: 'border-fm-crimson',

  // Muted Navy (Info/Tertiary)
  NAVY_BG: 'bg-fm-navy',
  NAVY_TEXT: 'text-fm-navy',
  NAVY_BORDER: 'border-fm-navy',

  // Chili Red (Danger)
  DANGER_BG: 'bg-fm-danger',
  DANGER_TEXT: 'text-fm-danger',
  DANGER_BORDER: 'border-fm-danger',

  // Black & White
  BLACK_BG: 'bg-black',
  WHITE_TEXT: 'text-white',
  WHITE_BG: 'bg-white',
  BLACK_TEXT: 'text-black',
} as const;

/**
 * Spacing Scale
 *
 * Consistent spacing values based on 5px increments.
 * Use these for margins, padding, gaps, and positioning.
 */
export const SPACING = {
  XS: '5px', // Extra small - tight spacing, small gaps
  SM: '10px', // Small - compact layouts, list items
  MD: '20px', // Medium - default spacing between elements
  LG: '40px', // Large - section spacing, major gaps
  XL: '60px', // Extra large - page sections, hero spacing
} as const;

/**
 * Spacing scale as numbers (for calculations)
 */
export const SPACING_VALUES = {
  XS: 5,
  SM: 10,
  MD: 20,
  LG: 40,
  XL: 60,
} as const;

/**
 * Tailwind spacing class mappings
 */
export const SPACING_CLASSES = {
  // Padding
  P_XS: 'p-[5px]',
  P_SM: 'p-[10px]',
  P_MD: 'p-[20px]',
  P_LG: 'p-[40px]',
  P_XL: 'p-[60px]',

  // Margin
  M_XS: 'm-[5px]',
  M_SM: 'm-[10px]',
  M_MD: 'm-[20px]',
  M_LG: 'm-[40px]',
  M_XL: 'm-[60px]',

  // Gap
  GAP_XS: 'gap-[5px]',
  GAP_SM: 'gap-[10px]',
  GAP_MD: 'gap-[20px]',
  GAP_LG: 'gap-[40px]',
  GAP_XL: 'gap-[60px]',
} as const;

/**
 * Typography Constants
 *
 * Font families and text styling guidelines.
 */
export const TYPOGRAPHY = {
  // Font Families
  PRIMARY_FONT: 'Canela', // Used for 99% of application
  FALLBACK_FONTS: 'Georgia, serif', // Fallback serif fonts

  // Font Weight
  WEIGHT_NORMAL: '400',
  WEIGHT_MEDIUM: '500',
  WEIGHT_BOLD: '700', // Use sparingly

  // Tailwind Classes
  FONT_CANELA: 'font-canela',
  FONT_BOLD: 'font-bold', // Use sparingly
  FONT_MEDIUM: 'font-medium',
  FONT_NORMAL: 'font-normal',
} as const;

/**
 * Text Capitalization Rules
 */
export const TEXT_RULES = {
  // Use standard sentence case for headers
  // Examples:
  // ✅ "Here's what we found."
  // ✅ "Event details."
  // ❌ "Here's What We Found"
  // ❌ "Event Details"
  HEADER_STYLE: 'sentence-case',

  // Use periods at end of headers where appropriate
  USE_PERIODS: true,

  // Bold text should be used sparingly
  BOLD_USAGE: 'minimal',
} as const;

/**
 * Depth/Layering System
 *
 * Material Design inspired depth approach for backgrounds.
 * Each level represents a layer in the visual hierarchy.
 */
export const DEPTH = {
  // Level 0: Transparent/outline (bottommost)
  LEVEL_0: {
    description: 'Transparent background with outline',
    example: 'FmCard outline variant',
    classes: 'bg-transparent border border-white/20',
  },

  // Level 1: Black frosted glass (base)
  LEVEL_1: {
    description: 'Base black frosted glass',
    classes: 'bg-black/60 backdrop-blur-sm',
  },

  // Level 2: Elevated frosted glass
  LEVEL_2: {
    description: 'Elevated frosted glass (brighter)',
    classes: 'bg-black/70 backdrop-blur-md',
  },

  // Level 3: High elevation
  LEVEL_3: {
    description: 'High elevation (brightest frosted glass)',
    classes: 'bg-black/80 backdrop-blur-lg',
  },
} as const;

/**
 * Border Radius
 *
 * Sharp edges are the default. Rounded corners should be used sparingly.
 */
export const BORDER_RADIUS = {
  NONE: '0', // Default - sharp corners
  MINIMAL: '2px', // Subtle rounding (rare use)

  // Tailwind Classes
  SHARP: 'rounded-none', // Default for most components
  SUBTLE: 'rounded-sm', // Use only when absolutely necessary
} as const;

/**
 * Design Elements
 */
export const DESIGN_ELEMENTS = {
  // Primary background pattern
  BACKGROUND: 'black-topography',
  BACKGROUND_CLASS: 'bg-topography',

  // Button styles
  BUTTON_STYLE: 'sharp-edges', // No rounded corners

  // Card styles
  CARD_DEFAULT: 'gold-outline-hover', // Semi-transparent, white border, gold on hover
  CARD_FROSTED: 'black-frosted-glass', // Frosted glass effect for modals/overlays
} as const;

/**
 * Component Naming Convention
 */
export const NAMING = {
  PREFIX: 'Fm', // Force Majeure prefix
  COMMON_PREFIX: 'FmCommon', // Common/reusable components

  // Examples:
  // - FmButton (specific component)
  // - FmCommonButton (common/reusable component)
  // - FmEventCard (domain-specific component)
} as const;

/**
 * Primary Building Block Components
 *
 * These are the core components that should be used to build the application.
 * Located in: /src/components/common/ or similar FmComponents directory
 */
export const PRIMARY_COMPONENTS = [
  'FmButton',
  'FmCard', // Two variants: outline and frosted glass
  'FmTextInput',
  'FmCheckbox',
  'FmDateBox',
  'FmDataGrid',
] as const;

/**
 * Icon Button Guidelines
 */
export const ICON_BUTTONS = {
  // Use icon buttons where appropriate for actions
  // Examples: edit, delete, close, expand, etc.
  USE_WHEN: 'Action is clear from icon context',
  STYLE: 'Sharp edges, minimal padding',
} as const;

/**
 * Input & Form Styling
 *
 * Based on FmCommonTextField and Input component patterns.
 */
export const INPUT_STYLES = {
  // Border Behavior
  BORDER_DEFAULT: 'Single border on all sides',
  BORDER_HOVER: 'Border changes to gold with glow',
  BORDER_FOCUS:
    'Remove all borders EXCEPT bottom border, make bottom thicker (3px), gold color',

  // Background States
  BG_DEFAULT: 'bg-background',
  BG_HOVER: 'bg-white/5',
  BG_FOCUS: 'bg-white/5',

  // Focus Effects
  FOCUS_BORDER_BOTTOM: 'border-b-[3px] border-b-fm-gold',
  FOCUS_GLOW: 'shadow-[0_4px_16px_rgba(223,186,125,0.3)]',
  FOCUS_RIPPLE: 'Slight ripple out from the borders when clicked',

  // Hover Effects
  HOVER_BORDER: 'border-fm-gold/50',
  HOVER_GLOW: 'shadow-[0_0_12px_rgba(223,186,125,0.15)]',

  // Complete Focus Classes (remove top/left/right borders)
  FOCUS_CLASSES:
    'focus-visible:outline-none focus-visible:bg-white/5 focus-visible:border-t-0 focus-visible:border-l-0 focus-visible:border-r-0 focus-visible:border-b-[3px] focus-visible:border-b-fm-gold focus-visible:shadow-[0_4px_16px_rgba(223,186,125,0.3)]',

  // Complete Hover Classes
  HOVER_CLASSES:
    'hover:bg-white/5 hover:border-fm-gold/50 hover:shadow-[0_0_12px_rgba(223,186,125,0.15)]',

  // Transition
  TRANSITION: 'transition-all duration-300',
} as const;

/**
 * Label Styling
 *
 * Labels should be small, muted color, and in ALL CAPS.
 */
export const LABEL_STYLES = {
  // Size and casing
  SIZE: 'text-xs',
  CASE: 'uppercase',
  TRACKING: 'tracking-wider',

  // Colors
  COLOR_DEFAULT: 'text-muted-foreground',
  COLOR_FOCUSED: 'text-fm-gold',

  // Complete Classes
  DEFAULT_CLASSES: 'text-xs uppercase tracking-wider text-muted-foreground',
  FOCUSED_CLASSES: 'text-xs uppercase tracking-wider text-fm-gold',
  TRANSITION: 'transition-colors duration-200',
} as const;

/**
 * Form Section Styling
 *
 * Styling for form section headers with gold-white gradient.
 */
export const FORM_SECTION_STYLES = {
  // Header gradient (gold → white)
  HEADER_GRADIENT: 'bg-gradient-to-r from-fm-gold to-white bg-clip-text text-transparent',
  HEADER_CLASSES: 'font-canela text-xl tracking-wide bg-gradient-to-r from-fm-gold to-white bg-clip-text text-transparent',

  // Description
  DESCRIPTION_CLASSES: 'text-sm text-muted-foreground mt-1',

  // Feathered gold divider
  DIVIDER_FEATHERED: 'h-px bg-gradient-to-r from-transparent via-fm-gold/50 to-transparent',
  DIVIDER_SUBTLE: 'h-px bg-gradient-to-r from-transparent via-fm-gold/30 to-transparent',
  DIVIDER_STRONG: 'h-px bg-gradient-to-r from-transparent via-fm-gold/70 to-transparent',
} as const;

/**
 * List/Menu Item Styling
 *
 * Based on FmCommonContextMenu - uses striped background pattern.
 * Alternating background opacity for visual separation.
 */
export const LIST_ITEM_STYLES = {
  // Striped Background Pattern - more apparent contrast
  EVEN_BG: 'bg-white/5', // Lighter stripe
  ODD_BG: 'bg-black/30', // Darker stripe

  // Hover States
  HOVER_BG: 'hover:bg-fm-gold/10',
  HOVER_SCALE: 'hover:scale-[1.02]',
  HOVER_GLOW: 'hover:shadow-lg hover:shadow-fm-gold/20',
  HOVER_TEXT: 'hover:text-white',

  // Focus States
  FOCUS_BG: 'focus:bg-fm-gold/15',
  FOCUS_SCALE: 'focus:scale-[1.02]',
  FOCUS_GLOW: 'focus:shadow-lg focus:shadow-fm-gold/20',
  FOCUS_TEXT: 'focus:text-white',

  // Active State
  ACTIVE_SCALE: 'active:scale-[0.98]',

  // Transition
  TRANSITION: 'transition-all duration-300',

  // Complete Classes for Even Items
  EVEN_CLASSES:
    'bg-white/5 hover:bg-fm-gold/10 hover:scale-[1.02] hover:shadow-lg hover:shadow-fm-gold/20 hover:text-white focus:bg-fm-gold/15 focus:scale-[1.02] focus:shadow-lg focus:shadow-fm-gold/20 focus:text-white active:scale-[0.98] transition-all duration-300',

  // Complete Classes for Odd Items
  ODD_CLASSES:
    'bg-black/30 hover:bg-fm-gold/10 hover:scale-[1.02] hover:shadow-lg hover:shadow-fm-gold/20 hover:text-white focus:bg-fm-gold/15 focus:scale-[1.02] focus:shadow-lg focus:shadow-fm-gold/20 focus:text-white active:scale-[0.98] transition-all duration-300',

  // Divider between items
  DIVIDER:
    'absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent',
} as const;

/**
 * Accessibility Guidelines
 */
export const A11Y = {
  // Always provide text alternatives for icons
  ICON_LABELS: 'required',

  // Ensure sufficient color contrast
  MIN_CONTRAST_RATIO: 4.5,

  // Use semantic HTML
  SEMANTIC_HTML: 'required',
} as const;

/**
 * Categorical Color Palette
 *
 * Used for distinguishing categories, tags, and types (e.g., page types).
 * Colors are designed to work on dark backgrounds with good contrast.
 * Each color has a matching background (with transparency) and text variant.
 */
export const CATEGORICAL_COLORS = {
  // Primary categories - most common page types
  event: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  ticketing: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  checkout: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/40' },
  checkout_success: { bg: 'bg-green-600/20', text: 'text-green-300', border: 'border-green-600/40' },
  checkout_cancel: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },

  // Content pages
  artist: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
  venue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
  home: { bg: 'bg-fm-gold/20', text: 'text-fm-gold', border: 'border-fm-gold/40' },

  // List pages
  event_list: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
  artist_list: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
  venue_list: { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' },

  // User pages
  profile: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40' },
  orders: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/40' },
  auth: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40' },

  // Admin/Dev pages
  admin: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40' },
  developer: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40' },
  demo: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/40' },

  // Other pages
  merch: { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-400', border: 'border-fuchsia-500/40' },
  contact: { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/40' },
  other: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/40' },
} as const;

/**
 * Get categorical color classes for a page type
 */
export function getPageTypeColors(pageType: string): {
  bg: string;
  text: string;
  border: string;
} {
  const colors = CATEGORICAL_COLORS[pageType as keyof typeof CATEGORICAL_COLORS];
  return colors || CATEGORICAL_COLORS.other;
}

/**
 * All page types with their display labels
 */
export const PAGE_TYPE_LABELS: Record<string, string> = {
  event: 'Event',
  ticketing: 'Ticketing',
  checkout: 'Checkout',
  checkout_success: 'Success',
  checkout_cancel: 'Cancelled',
  artist: 'Artist',
  venue: 'Venue',
  home: 'Home',
  event_list: 'Events',
  artist_list: 'Artists',
  venue_list: 'Venues',
  profile: 'Profile',
  orders: 'Orders',
  auth: 'Auth',
  admin: 'Admin',
  developer: 'Dev',
  demo: 'Demo',
  merch: 'Merch',
  contact: 'Contact',
  other: 'Other',
};

/**
 * Type exports for TypeScript
 */
export type ColorKey = keyof typeof COLORS;
export type SpacingKey = keyof typeof SPACING;
export type DepthLevel = keyof typeof DEPTH;
export type PrimaryComponent = (typeof PRIMARY_COMPONENTS)[number];
export type PageTypeKey = keyof typeof CATEGORICAL_COLORS;
