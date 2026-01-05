// Shared utilities exports
export { cn } from './utils';
export { logApiError, logApi } from './apiLogger';
export { claimScavengerReward } from './scavengerApi';
export { getImageUrl } from './imageUtils';
export { formatTimeDisplay, parseTimeToMinutes } from './timeUtils';
export { sessionPersistence } from './sessionPersistence';

// Form validation utilities
// Address utilities
export {
  formatFullAddress,
  getGoogleMapsEmbedUrl,
  getGoogleMapsSearchUrl,
} from './addressUtils';

// Fuzzy search utilities
export {
  fuzzySearch,
  reRankWithFuse,
  calculateSimilarity,
  createFuseInstance,
  ARTIST_SEARCH_CONFIG,
  EVENT_SEARCH_CONFIG,
  VENUE_SEARCH_CONFIG,
  PROFILE_SEARCH_CONFIG,
  ORGANIZATION_SEARCH_CONFIG,
  type FuzzySearchOptions,
  type FuzzySearchResult,
  type SearchableItem,
} from './fuzzySearch';

export {
  // Field validators
  stringRequired,
  stringOptional,
  emailField,
  passwordField,
  urlField,
  urlOptional,
  phoneField,
  dateField,
  futureDateField,
  pastDateField,
  priceField,
  positiveNumber,
  // Common schemas
  contactFormSchema,
  eventFormSchema,
  profileFormSchema,
  // Helpers
  sanitizeInput,
  encodeForUrl,
  prepareFormData,
  createFileValidation,
  passwordConfirmation,
} from './formValidation';
