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
 *
 * HIGH importance: Wider container (max-w-40) to showcase horizontal logos
 * MEDIUM/LOW: Square containers with object-contain to fit logos completely
 */
export const PARTNER_DISPLAY_CONFIG = {
  [PARTNER_IMPORTANCE.HIGH]: {
    imageContainerSize: 'w-full max-w-40 h-24', // Wider container for prominent sponsors
    iconSize: 'h-12 w-12',
    textSize: 'text-base font-medium',
    maxPerRow: 2,
  },
  [PARTNER_IMPORTANCE.MEDIUM]: {
    imageContainerSize: 'w-16 h-16',
    iconSize: 'h-8 w-8',
    textSize: 'text-sm',
    maxPerRow: 3,
  },
  [PARTNER_IMPORTANCE.LOW]: {
    imageContainerSize: 'w-12 h-12',
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
 * Get image container size class for a given importance level
 */
export function getPartnerImageSize(importance: number): string {
  return getPartnerDisplayConfig(importance).imageContainerSize;
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
