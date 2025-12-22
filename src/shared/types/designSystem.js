/**
 * Force Majeure Design System Type Definitions
 *
 * Strict TypeScript types to enforce design system compliance at compile time.
 * These types ensure developers use approved colors, spacing, and patterns.
 *
 * @see /docs/DESIGN_SYSTEM.md
 * @see /src/shared/constants/designSystem.ts
 */
import { COLORS, SPACING } from '@/shared';
/**
 * Type guard to check if a color is from the design system
 */
export function isDesignSystemColor(color) {
    return Object.values(COLORS).includes(color);
}
/**
 * Type guard to check if a spacing value is from the design system
 */
export function isDesignSystemSpacing(spacing) {
    return Object.values(SPACING).includes(spacing);
}
/**
 * Type guard to check if a depth level is valid
 */
export function isValidDepthLevel(level) {
    return [0, 1, 2, 3].includes(level);
}
/**
 * Helper to create a design system compliant header
 */
export function createHeaderText(text) {
    // This is a runtime function but provides type safety
    return text;
}
