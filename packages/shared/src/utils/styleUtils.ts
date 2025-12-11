/**
 * Force Majeure Design System Utilities
 *
 * Centralized styling helpers to ensure consistency across components.
 * All utilities enforce the design system guidelines defined in:
 * @see /docs/DESIGN_SYSTEM.md
 * @see /src/shared/constants/designSystem.ts
 */

import {
  SPACING_CLASSES,
  DEPTH,
  INPUT_STYLES,
  LABEL_STYLES,
  LIST_ITEM_STYLES,
  COLOR_CLASSES,
  BORDER_RADIUS,
  TYPOGRAPHY,
} from '../constants/designSystem';

// Minimal cn implementation for merging class names
function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Get striped list item classes based on index
 */
export function getListItemClasses(
  index: number,
  customClasses?: string
): string {
  const baseClasses =
    index % 2 === 0
      ? LIST_ITEM_STYLES.EVEN_CLASSES
      : LIST_ITEM_STYLES.ODD_CLASSES;

  return cn(baseClasses, customClasses);
}

/**
 * Get input field classes with proper focus/hover states
 */
export function getInputClasses(customClasses?: string): string {
  return cn(
    'border border-input',
    INPUT_STYLES.BG_DEFAULT,
    INPUT_STYLES.HOVER_CLASSES,
    INPUT_STYLES.FOCUS_CLASSES,
    INPUT_STYLES.TRANSITION,
    BORDER_RADIUS.SHARP,
    TYPOGRAPHY.FONT_CANELA,
    customClasses
  );
}

/**
 * Get label classes with optional focused state
 */
export function getLabelClasses(
  focused: boolean = false,
  customClasses?: string
): string {
  return cn(
    focused ? LABEL_STYLES.FOCUSED_CLASSES : LABEL_STYLES.DEFAULT_CLASSES,
    LABEL_STYLES.TRANSITION,
    customClasses
  );
}

/**
 * Get depth layer classes based on elevation level
 */
export function getDepthClasses(
  level: 0 | 1 | 2 | 3,
  customClasses?: string
): string {
  const depthMap = {
    0: DEPTH.LEVEL_0.classes,
    1: DEPTH.LEVEL_1.classes,
    2: DEPTH.LEVEL_2.classes,
    3: DEPTH.LEVEL_3.classes,
  };

  return cn(depthMap[level], customClasses);
}

/**
 * Get button variant classes
 */
export function getButtonClasses(
  variant: 'primary' | 'secondary' | 'danger' | 'outline' | 'info' = 'primary',
  customClasses?: string
): string {
  const variants = {
    primary: `${COLOR_CLASSES.GOLD_BG} ${COLOR_CLASSES.BLACK_TEXT} hover:opacity-90`,
    secondary: `${COLOR_CLASSES.CRIMSON_BG} ${COLOR_CLASSES.WHITE_TEXT} hover:opacity-90`,
    danger: `${COLOR_CLASSES.DANGER_BG} ${COLOR_CLASSES.WHITE_TEXT} hover:opacity-90`,
    info: `${COLOR_CLASSES.NAVY_BG} ${COLOR_CLASSES.WHITE_TEXT} hover:opacity-90`,
    outline: `bg-transparent border ${COLOR_CLASSES.GOLD_BORDER} ${COLOR_CLASSES.GOLD_TEXT} ${COLOR_CLASSES.GOLD_HOVER_BG} hover:text-black`,
  };

  return cn(
    BORDER_RADIUS.SHARP,
    'transition-all duration-300',
    SPACING_CLASSES.P_SM,
    TYPOGRAPHY.FONT_CANELA,
    variants[variant],
    customClasses
  );
}

/**
 * Convert text to sentence case
 */
export function toSentenceCase(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format header text according to design system rules
 */
export function formatHeader(text: string, addPeriod: boolean = true): string {
  if (!text) return text;

  const sentenced = toSentenceCase(text);

  if (
    addPeriod &&
    !sentenced.endsWith('.') &&
    !sentenced.endsWith('?') &&
    !sentenced.endsWith('!')
  ) {
    return sentenced + '.';
  }

  return sentenced;
}

/**
 * Get card classes with variant support
 */
export function getCardClasses(
  variant: 'outline' | 'frosted' | 'elevated' | 'high' = 'frosted',
  customClasses?: string
): string {
  const variantMap = {
    outline: getDepthClasses(0),
    frosted: getDepthClasses(1),
    elevated: getDepthClasses(2),
    high: getDepthClasses(3),
  };

  return cn(
    variantMap[variant],
    BORDER_RADIUS.SHARP,
    SPACING_CLASSES.P_MD,
    customClasses
  );
}

/**
 * Get icon button classes
 */
export function getIconButtonClasses(customClasses?: string): string {
  return cn(
    'p-[5px]',
    BORDER_RADIUS.SHARP,
    COLOR_CLASSES.WHITE_TEXT,
    COLOR_CLASSES.GOLD_HOVER_TEXT,
    'transition-colors duration-200',
    customClasses
  );
}

/**
 * Get spacing value by key
 */
export function getSpacingValue(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): string {
  const spacingMap = {
    xs: '5px',
    sm: '10px',
    md: '20px',
    lg: '40px',
    xl: '60px',
  };

  return spacingMap[size];
}

/**
 * Frosted glass styling constants
 */
export const GLASS_STYLES = {
  BASE: 'bg-black/60 backdrop-blur-sm',
  ELEVATED: 'bg-black/70 backdrop-blur-md',
  HIGH: 'bg-black/80 backdrop-blur-lg',
  OUTLINE: 'bg-transparent border border-white/20',
  GRADIENT: 'bg-gradient-to-b from-background to-background/95 backdrop-blur-xl',
  PANEL: cn(
    'bg-black/70 backdrop-blur-md',
    'border-2 border-white/20',
    'shadow-xl shadow-black/50'
  ),
  MODAL_OVERLAY: 'bg-black/80 backdrop-blur-lg',
  DROPDOWN: cn(
    'bg-gradient-to-r from-background to-background/95',
    'backdrop-blur-xl',
    'border-2 border-white/20',
    'shadow-xl shadow-black/50'
  ),
} as const;

/**
 * Gold accent styling constants
 */
export const GOLD_ACCENT_STYLES = {
  TEXT: COLOR_CLASSES.GOLD_TEXT,
  BG: COLOR_CLASSES.GOLD_BG,
  BORDER: COLOR_CLASSES.GOLD_BORDER,
  BORDER_GLOW: cn(
    COLOR_CLASSES.GOLD_BORDER,
    'shadow-[0_0_12px_rgba(223,186,125,0.3)]'
  ),
  HOVER_BG: cn(
    COLOR_CLASSES.GOLD_HOVER_BG,
    'transition-colors duration-300'
  ),
  HOVER_TEXT: cn(
    COLOR_CLASSES.GOLD_HOVER_TEXT,
    'transition-colors duration-300'
  ),
  HOVER_BORDER_GLOW: cn(
    'hover:border-fm-gold/50',
    'hover:shadow-[0_0_12px_rgba(223,186,125,0.15)]',
    'transition-all duration-300'
  ),
  FOCUS_BORDER_GLOW: cn(
    'focus-visible:border-fm-gold',
    'focus-visible:shadow-[0_4px_16px_rgba(223,186,125,0.3)]',
    'focus-visible:outline-none',
    'transition-all duration-300'
  ),
  ACTIVE: 'active:opacity-90',
  HOVER_OVERLAY: 'hover:bg-fm-gold/10 transition-colors duration-300',
  FOCUS_OVERLAY: 'focus:bg-fm-gold/15 transition-colors duration-300',
  INTERACTIVE_OVERLAY: cn(
    'hover:bg-fm-gold/10',
    'focus:bg-fm-gold/15',
    'active:opacity-90',
    'transition-all duration-300'
  ),
  DIVIDER: 'h-px bg-gradient-to-r from-transparent via-fm-gold/30 to-transparent',
} as const;
