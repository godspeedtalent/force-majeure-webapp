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
} from '@/shared';
import { cn } from '@/shared';

/**
 * Get striped list item classes based on index
 * Used for context menus, dropdowns, and any listed options
 *
 * @param index - The zero-based index of the item
 * @param customClasses - Additional classes to merge
 * @returns Merged class string with striped background pattern
 *
 * @example
 * ```tsx
 * {items.map((item, idx) => (
 *   <div key={item.id} className={getListItemClasses(idx)}>
 *     {item.label}
 *   </div>
 * ))}
 * ```
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
 * Implements the bottom-border-only-on-focus pattern from FmCommonTextField
 *
 * @param customClasses - Additional classes to merge
 * @returns Merged class string for input fields
 *
 * @example
 * ```tsx
 * <input
 *   type="text"
 *   className={getInputClasses('w-full h-12')}
 * />
 * ```
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
 * Labels are small, uppercase, muted by default, gold when focused
 *
 * @param focused - Whether the associated input is focused
 * @param customClasses - Additional classes to merge
 * @returns Merged class string for labels
 *
 * @example
 * ```tsx
 * const [focused, setFocused] = useState(false);
 *
 * <label className={getLabelClasses(focused)}>
 *   EMAIL ADDRESS
 * </label>
 * <input
 *   onFocus={() => setFocused(true)}
 *   onBlur={() => setFocused(false)}
 * />
 * ```
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
 * Level 0: Transparent with outline
 * Level 1: Base frosted glass
 * Level 2: Elevated frosted glass
 * Level 3: High elevation frosted glass
 *
 * @param level - Depth level (0-3)
 * @param customClasses - Additional classes to merge
 * @returns Merged class string for depth layering
 *
 * @example
 * ```tsx
 * // Base card
 * <div className={getDepthClasses(1)}>...</div>
 *
 * // Modal overlay
 * <div className={getDepthClasses(3)}>...</div>
 * ```
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
 *
 * @param variant - Button style variant
 * @param customClasses - Additional classes to merge
 * @returns Merged class string for buttons
 *
 * @example
 * ```tsx
 * <button className={getButtonClasses('primary')}>
 *   Save changes
 * </button>
 *
 * <button className={getButtonClasses('danger')}>
 *   Delete
 * </button>
 * ```
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
 * Convert text to sentence case (first letter capitalized, rest lowercase)
 *
 * @param text - Text to convert
 * @returns Sentence-cased text
 *
 * @example
 * ```tsx
 * toSentenceCase("HELLO WORLD") // "Hello world"
 * toSentenceCase("hello WORLD") // "Hello world"
 * ```
 */
export function toSentenceCase(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format header text according to design system rules:
 * - Sentence case (first letter capitalized, rest lowercase)
 * - Add period if not present (unless ends with ? or !)
 *
 * @param text - Header text to format
 * @param addPeriod - Whether to add period at the end (default: true)
 * @returns Formatted header text
 *
 * @example
 * ```tsx
 * formatHeader("WELCOME TO THE EVENT") // "Welcome to the event."
 * formatHeader("Are you sure?") // "Are you sure?"
 * formatHeader("Click here", false) // "Click here"
 * ```
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
 *
 * @param variant - Card style variant
 * @param customClasses - Additional classes to merge
 * @returns Merged class string for cards
 *
 * @example
 * ```tsx
 * <div className={getCardClasses('frosted')}>
 *   Content
 * </div>
 * ```
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
 * Minimal padding, sharp edges, accessible
 *
 * @param customClasses - Additional classes to merge
 * @returns Merged class string for icon buttons
 *
 * @example
 * ```tsx
 * <button
 *   className={getIconButtonClasses()}
 *   aria-label="Close modal"
 * >
 *   <XIcon />
 * </button>
 * ```
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
 * Helper to use spacing constants programmatically
 *
 * @param size - Spacing size key
 * @returns Spacing class string
 *
 * @example
 * ```tsx
 * <div className={getSpacing('md')}>...</div>
 * ```
 */
export function getSpacing(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): string {
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
 * Based on the depth system with additional glass-specific effects
 *
 * @example
 * ```tsx
 * // Base glass panel
 * <div className={GLASS_STYLES.BASE}>...</div>
 *
 * // Elevated glass modal
 * <div className={GLASS_STYLES.ELEVATED}>...</div>
 *
 * // High glass overlay
 * <div className={GLASS_STYLES.HIGH}>...</div>
 * ```
 */
export const GLASS_STYLES = {
  /**
   * Base frosted glass (Level 1)
   * Light blur with 60% black opacity
   */
  BASE: 'bg-black/60 backdrop-blur-sm',

  /**
   * Elevated frosted glass (Level 2)
   * Medium blur with 70% black opacity
   */
  ELEVATED: 'bg-black/70 backdrop-blur-md',

  /**
   * High elevation frosted glass (Level 3)
   * Strong blur with 80% black opacity
   */
  HIGH: 'bg-black/80 backdrop-blur-lg',

  /**
   * Outline/transparent with border (Level 0)
   * No background, only border
   */
  OUTLINE: 'bg-transparent border border-white/20',

  /**
   * Glass with gradient backdrop
   * Gradient from solid to transparent
   */
  GRADIENT: 'bg-gradient-to-b from-background to-background/95 backdrop-blur-xl',

  /**
   * Glass panel with border and shadow
   * Complete glass panel styling
   */
  PANEL: cn(
    'bg-black/70 backdrop-blur-md',
    'border-2 border-white/20',
    'shadow-xl shadow-black/50'
  ),

  /**
   * Modal overlay glass
   * Full screen overlay with blur
   */
  MODAL_OVERLAY: 'bg-black/80 backdrop-blur-lg',

  /**
   * Dropdown menu glass
   * Optimized for menus and dropdowns
   */
  DROPDOWN: cn(
    'bg-gradient-to-r from-background to-background/95',
    'backdrop-blur-xl',
    'border-2 border-white/20',
    'shadow-xl shadow-black/50'
  ),
} as const;

/**
 * Gold accent styling constants
 * Reusable gold-themed styles for interactive elements
 *
 * @example
 * ```tsx
 * // Gold border
 * <div className={GOLD_ACCENT_STYLES.BORDER}>...</div>
 *
 * // Gold text
 * <span className={GOLD_ACCENT_STYLES.TEXT}>Important</span>
 *
 * // Gold hover effect
 * <button className={GOLD_ACCENT_STYLES.HOVER}>Click me</button>
 * ```
 */
export const GOLD_ACCENT_STYLES = {
  /**
   * Gold text color
   */
  TEXT: COLOR_CLASSES.GOLD_TEXT,

  /**
   * Gold background
   */
  BG: COLOR_CLASSES.GOLD_BG,

  /**
   * Gold border
   */
  BORDER: COLOR_CLASSES.GOLD_BORDER,

  /**
   * Gold border with glow
   */
  BORDER_GLOW: cn(
    COLOR_CLASSES.GOLD_BORDER,
    'shadow-[0_0_12px_rgba(223,186,125,0.3)]'
  ),

  /**
   * Hover state - gold background
   */
  HOVER_BG: cn(
    COLOR_CLASSES.GOLD_HOVER_BG,
    'transition-colors duration-300'
  ),

  /**
   * Hover state - gold text
   */
  HOVER_TEXT: cn(
    COLOR_CLASSES.GOLD_HOVER_TEXT,
    'transition-colors duration-300'
  ),

  /**
   * Hover state - gold border with glow
   */
  HOVER_BORDER_GLOW: cn(
    'hover:border-fm-gold/50',
    'hover:shadow-[0_0_12px_rgba(223,186,125,0.15)]',
    'transition-all duration-300'
  ),

  /**
   * Focus state - gold border with strong glow
   */
  FOCUS_BORDER_GLOW: cn(
    'focus-visible:border-fm-gold',
    'focus-visible:shadow-[0_4px_16px_rgba(223,186,125,0.3)]',
    'focus-visible:outline-none',
    'transition-all duration-300'
  ),

  /**
   * Active/pressed state - slightly darker gold
   */
  ACTIVE: 'active:opacity-90',

  /**
   * Gold accent on hover (background overlay)
   */
  HOVER_OVERLAY: 'hover:bg-fm-gold/10 transition-colors duration-300',

  /**
   * Gold accent on focus (background overlay)
   */
  FOCUS_OVERLAY: 'focus:bg-fm-gold/15 transition-colors duration-300',

  /**
   * Combined hover and focus overlay
   */
  INTERACTIVE_OVERLAY: cn(
    'hover:bg-fm-gold/10',
    'focus:bg-fm-gold/15',
    'active:opacity-90',
    'transition-all duration-300'
  ),

  /**
   * Gold divider line
   */
  DIVIDER: 'h-px bg-gradient-to-r from-transparent via-fm-gold/30 to-transparent',

  /**
   * Gold underline (for links or emphasis)
   */
  UNDERLINE: 'border-b border-fm-gold',

  /**
   * Gold underline on hover
   */
  HOVER_UNDERLINE: cn(
    'hover:border-b hover:border-fm-gold',
    'transition-all duration-300'
  ),

  /**
   * Gold glow effect (shadow only)
   */
  GLOW: 'shadow-[0_0_20px_rgba(223,186,125,0.4)]',

  /**
   * Subtle gold glow
   */
  GLOW_SUBTLE: 'shadow-[0_0_12px_rgba(223,186,125,0.2)]',

  /**
   * Strong gold glow
   */
  GLOW_STRONG: 'shadow-[0_4px_24px_rgba(223,186,125,0.5)]',
} as const;

/**
 * Destructive/Danger button styling constants
 * Centralized danger-themed styles for destructive actions
 *
 * Pattern: Frosted danger background with solid danger on hover
 * - Default: bg-destructive/20 with danger border/text and subtle glow
 * - Hover: Solid bg-destructive with black text
 *
 * @example
 * ```tsx
 * // Danger button
 * <button className={DANGER_BUTTON_STYLES.BASE}>Delete</button>
 *
 * // Danger icon button
 * <button className={DANGER_BUTTON_STYLES.ICON}>
 *   <TrashIcon />
 * </button>
 * ```
 */
export const DANGER_BUTTON_STYLES = {
  /**
   * Base danger button style
   * Frosted danger background, turns solid on hover
   */
  BASE: cn(
    'bg-destructive/20 backdrop-blur-sm',
    'border border-destructive',
    'text-destructive',
    'hover:bg-destructive hover:text-black hover:border-destructive',
    'shadow-[0_0_12px_hsl(var(--destructive)/0.2)]',
    'hover:shadow-[0_0_20px_hsl(var(--destructive)/0.4)]',
    'transition-all duration-200'
  ),

  /**
   * Danger button with scale animation
   * Includes hover scale-up and active scale-down
   */
  WITH_SCALE: cn(
    'bg-destructive/20 backdrop-blur-sm',
    'border border-destructive',
    'text-destructive',
    'hover:bg-destructive hover:text-black hover:border-destructive',
    'shadow-[0_0_12px_hsl(var(--destructive)/0.2)]',
    'hover:shadow-[0_0_20px_hsl(var(--destructive)/0.4)]',
    'hover:scale-105 active:scale-95',
    'transition-all duration-200'
  ),

  /**
   * Danger text color only (for icons or text without button background)
   */
  TEXT: 'text-destructive',

  /**
   * Danger border only
   */
  BORDER: 'border border-destructive',

  /**
   * Danger glow effect (subtle)
   */
  GLOW: 'shadow-[0_0_12px_hsl(var(--destructive)/0.2)]',

  /**
   * Danger glow effect (strong, for hover states)
   */
  GLOW_STRONG: 'shadow-[0_0_20px_hsl(var(--destructive)/0.4)]',

  /**
   * Hover state classes only (for custom implementations)
   */
  HOVER_CLASSES: cn(
    'hover:bg-destructive hover:text-black hover:border-destructive',
    'hover:shadow-[0_0_20px_hsl(var(--destructive)/0.4)]'
  ),
} as const;
