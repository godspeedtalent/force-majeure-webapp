/**
 * Time-related constants used throughout the application
 *
 * Centralizes magic numbers for time calculations to improve
 * code readability and maintainability.
 */
export const TIME_CONSTANTS = {
    /** Hours in a day (24-hour format) */
    HOURS_IN_DAY: 24,
    /** Minutes in an hour */
    MINUTES_IN_HOUR: 60,
    /** Seconds in a minute */
    SECONDS_IN_MINUTE: 60,
    /** Milliseconds in a second */
    MILLISECONDS_IN_SECOND: 1000,
    /** Noon hour (12-hour format) */
    NOON_HOUR: 12,
    /** Midnight hour (24-hour format) */
    MIDNIGHT_HOUR: 0,
    /** After hours threshold (10 PM) */
    AFTER_HOURS_START: 22,
    /** Early morning threshold (6 AM) */
    EARLY_MORNING_END: 6,
};
/**
 * Derived time calculations
 */
export const TIME_CALCULATIONS = {
    /** Milliseconds in a minute */
    get MILLISECONDS_IN_MINUTE() {
        return TIME_CONSTANTS.SECONDS_IN_MINUTE * TIME_CONSTANTS.MILLISECONDS_IN_SECOND;
    },
    /** Milliseconds in an hour */
    get MILLISECONDS_IN_HOUR() {
        return this.MILLISECONDS_IN_MINUTE * TIME_CONSTANTS.MINUTES_IN_HOUR;
    },
    /** Milliseconds in a day */
    get MILLISECONDS_IN_DAY() {
        return this.MILLISECONDS_IN_HOUR * TIME_CONSTANTS.HOURS_IN_DAY;
    },
    /** Seconds in an hour */
    get SECONDS_IN_HOUR() {
        return TIME_CONSTANTS.SECONDS_IN_MINUTE * TIME_CONSTANTS.MINUTES_IN_HOUR;
    },
    /** Seconds in a day */
    get SECONDS_IN_DAY() {
        return this.SECONDS_IN_HOUR * TIME_CONSTANTS.HOURS_IN_DAY;
    },
};
/**
 * UI-related constants (toolbar, modals, etc.)
 */
export const UI_DIMENSIONS = {
    /** FmToolbar default width in pixels */
    TOOLBAR_DEFAULT_WIDTH: 384,
    /** FmToolbar minimum width in pixels */
    TOOLBAR_MIN_WIDTH: 320,
    /** FmToolbar hover delay in milliseconds */
    TOOLBAR_HOVER_DELAY: 1000,
};
