/**
 * Partner-related constants used throughout the application
 *
 * Centralizes partner importance levels and styling to improve
 * code maintainability and consistency.
 */

/**
 * Partner importance levels
 */
export const PARTNER_IMPORTANCE = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
} as const;

export type PartnerImportance = (typeof PARTNER_IMPORTANCE)[keyof typeof PARTNER_IMPORTANCE];

/**
 * Partner display configuration by importance level
 */
export const PARTNER_DISPLAY_CONFIG = {
  [PARTNER_IMPORTANCE.HIGH]: {
    imageSize: 'w-20 h-20',
    iconSize: 'h-10 w-10',
    textSize: 'text-base font-medium',
    maxPerRow: 2,
  },
  [PARTNER_IMPORTANCE.MEDIUM]: {
    imageSize: 'w-16 h-16',
    iconSize: 'h-8 w-8',
    textSize: 'text-sm',
    maxPerRow: 3,
  },
  [PARTNER_IMPORTANCE.LOW]: {
    imageSize: 'w-12 h-12',
    iconSize: 'h-6 w-6',
    textSize: 'text-xs',
    maxPerRow: 5,
  },
} as const;

/**
 * Get display configuration for a given importance level
 */
export function getPartnerDisplayConfig(importance: number) {
  return PARTNER_DISPLAY_CONFIG[importance as PartnerImportance] ?? PARTNER_DISPLAY_CONFIG[PARTNER_IMPORTANCE.LOW];
}

/**
 * Get image size class for a given importance level
 */
export function getPartnerImageSize(importance: number): string {
  return getPartnerDisplayConfig(importance).imageSize;
}

/**
 * Get icon size class for a given importance level
 */
export function getPartnerIconSize(importance: number): string {
  return getPartnerDisplayConfig(importance).iconSize;
}

/**
 * Get text size class for a given importance level
 */
export function getPartnerTextSize(importance: number): string {
  return getPartnerDisplayConfig(importance).textSize;
}

/**
 * Get max items per row for a given importance level
 */
export function getPartnerMaxPerRow(importance: number): number {
  return getPartnerDisplayConfig(importance).maxPerRow;
}
