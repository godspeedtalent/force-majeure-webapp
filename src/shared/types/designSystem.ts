/**
 * Force Majeure Design System Type Definitions
 * 
 * Strict TypeScript types to enforce design system compliance at compile time.
 * These types ensure developers use approved colors, spacing, and patterns.
 * 
 * @see /docs/DESIGN_SYSTEM.md
 * @see /src/shared/constants/designSystem.ts
 */

import { COLORS, SPACING } from '@/shared/constants/designSystem';

/**
 * Only allow design system colors
 * Prevents hardcoded hex values or arbitrary colors
 */
export type DesignSystemColor = typeof COLORS[keyof typeof COLORS];

/**
 * Only allow design system spacing values
 * Enforces the 5px-based scale: 5, 10, 20, 40, 60
 */
export type DesignSystemSpacing = typeof SPACING[keyof typeof SPACING];

/**
 * Only allow design system depth levels
 * 0: Transparent outline
 * 1: Base frosted glass
 * 2: Elevated
 * 3: High elevation
 */
export type DepthLevel = 0 | 1 | 2 | 3;

/**
 * Button variant types
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'info';

/**
 * Card variant types
 */
export type CardVariant = 'outline' | 'frosted' | 'elevated' | 'high';

/**
 * Spacing size keys
 */
export type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Design system compliant component props
 * Use this interface when creating new components that should follow the design system
 */
export interface DesignSystemProps {
  /** Custom className for additional styling */
  className?: string;
  
  /** Children elements */
  children?: React.ReactNode;
}

/**
 * Input field props following design system patterns
 */
export interface DesignSystemInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  /** Label text (will be displayed in uppercase) */
  label: string;
  
  /** Whether the field is required */
  required?: boolean;
  
  /** Error message to display */
  error?: string;
  
  /** Description text */
  description?: string;
  
  /** Custom className */
  className?: string;
  
  /** Container className */
  containerClassName?: string;
}

/**
 * Button props following design system patterns
 */
export interface DesignSystemButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Button variant */
  variant?: ButtonVariant;
  
  /** Custom className */
  className?: string;
  
  /** Children elements */
  children: React.ReactNode;
}

/**
 * Card props following design system patterns
 */
export interface DesignSystemCardProps extends DesignSystemProps {
  /** Card variant determining depth level */
  variant?: CardVariant;
}

/**
 * List item props with striped background pattern
 */
export interface DesignSystemListItemProps extends DesignSystemProps {
  /** Index of the item (used for striped pattern) */
  index: number;
  
  /** Click handler */
  onClick?: () => void;
}

/**
 * Label props following design system patterns
 */
export interface DesignSystemLabelProps extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'className'> {
  /** Whether the associated input is focused */
  focused?: boolean;
  
  /** Custom className */
  className?: string;
  
  /** Children elements */
  children: React.ReactNode;
}

/**
 * Icon button props following design system patterns
 */
export interface DesignSystemIconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Accessible label (required for icon buttons) */
  'aria-label': string;
  
  /** Custom className */
  className?: string;
  
  /** Icon element */
  children: React.ReactNode;
}

/**
 * Type guard to check if a color is from the design system
 */
export function isDesignSystemColor(color: string): color is DesignSystemColor {
  return Object.values(COLORS).includes(color as any);
}

/**
 * Type guard to check if a spacing value is from the design system
 */
export function isDesignSystemSpacing(spacing: string): spacing is DesignSystemSpacing {
  return Object.values(SPACING).includes(spacing as any);
}

/**
 * Type guard to check if a depth level is valid
 */
export function isValidDepthLevel(level: number): level is DepthLevel {
  return [0, 1, 2, 3].includes(level);
}

/**
 * Branded type to mark components as design system compliant
 * Used for documentation and type safety
 */
export type DesignSystemCompliant<T> = T & {
  readonly __designSystemCompliant: unique symbol;
};

/**
 * Helper type for extracting component props while maintaining design system compliance
 */
export type WithDesignSystem<T extends DesignSystemProps> = T & {
  /** Indicates this component follows design system guidelines */
  readonly __followsDesignSystem: true;
};

/**
 * Utility type for components that must use design system colors
 */
export type WithDesignSystemColor<T> = T & {
  color: DesignSystemColor;
};

/**
 * Utility type for components that must use design system spacing
 */
export type WithDesignSystemSpacing<T> = T & {
  spacing: DesignSystemSpacing;
};

/**
 * Header text that follows design system rules
 * - Sentence case
 * - Optional period at the end
 */
export type DesignSystemHeaderText = string & {
  readonly __sentenceCase: true;
};

/**
 * Helper to create a design system compliant header
 */
export function createHeaderText(text: string): DesignSystemHeaderText {
  // This is a runtime function but provides type safety
  return text as DesignSystemHeaderText;
}
