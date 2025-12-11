// Shared utilities exports
export { logApiError, logApi } from './apiLogger';
export { claimScavengerReward } from './scavengerApi';
export { formatTimeDisplay, parseTimeToMinutes } from './timeUtils';
export { sessionPersistence } from './sessionPersistence';

// Form validation utilities
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
