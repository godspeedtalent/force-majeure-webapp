/**
 * Demo Mode Types
 *
 * Type definitions for the mobile demo mode feature that visualizes
 * touch interactions during screen recordings.
 */

/**
 * Size variants for touch indicators
 */
export type IndicatorSize = 'sm' | 'md' | 'lg';

/**
 * Size values in pixels for each indicator size
 */
export const INDICATOR_SIZE_VALUES: Record<IndicatorSize, number> = {
  sm: 40,
  md: 60,
  lg: 80,
};

/**
 * Demo mode settings that can be configured by the user
 */
export interface DemoModeSettings {
  /** Whether demo mode is currently enabled */
  enabled: boolean;
  /** Whether to delay actions before they execute */
  delayEnabled: boolean;
  /** Delay duration in milliseconds (500-2000) */
  delayDuration: number;
  /** Size of touch indicators */
  indicatorSize: IndicatorSize;
  /** Whether to show long press fill animation */
  showLongPressIndicator: boolean;
  /** Long press detection threshold in milliseconds */
  longPressThreshold: number;
}

/**
 * Default settings for demo mode
 * Note: enabled always defaults to false for safety
 */
export const DEFAULT_DEMO_MODE_SETTINGS: DemoModeSettings = {
  enabled: false,
  delayEnabled: false,
  delayDuration: 1000,
  indicatorSize: 'md',
  showLongPressIndicator: true,
  longPressThreshold: 500,
};

/**
 * Type of touch interaction
 */
export type TouchType = 'tap' | 'longPress' | 'move';

/**
 * Represents a single touch point being tracked
 */
export interface TouchPoint {
  /** Unique identifier for this touch */
  id: string;
  /** X coordinate relative to viewport */
  x: number;
  /** Y coordinate relative to viewport */
  y: number;
  /** Timestamp when touch started */
  timestamp: number;
  /** Type of touch interaction */
  type: TouchType;
  /** Whether the touch is still active (finger down) */
  isActive: boolean;
  /** Original touch identifier from TouchEvent */
  touchIdentifier: number;
  /** Target element that was touched */
  target: EventTarget | null;
}

/**
 * State for a pending delayed action
 */
export interface PendingAction {
  /** Touch point that triggered the action */
  touchPoint: TouchPoint;
  /** Timer ID for the delay */
  timerId: ReturnType<typeof setTimeout>;
  /** When the action will execute */
  executeAt: number;
}

/**
 * Context value for demo mode
 */
export interface DemoModeContextValue {
  /** Current settings */
  settings: DemoModeSettings;
  /** Update one or more settings */
  updateSettings: (partial: Partial<DemoModeSettings>) => void;
  /** Shorthand for settings.enabled */
  isActive: boolean;
  /** Enable demo mode */
  enable: () => void;
  /** Disable demo mode */
  disable: () => void;
  /** Toggle demo mode on/off */
  toggle: () => void;
}
