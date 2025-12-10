/**
 * Shared Services
 *
 * Services that are reusable across multiple features.
 *
 * Architecture Pattern:
 * - Feature services (eventService, venueService, etc.) handle database operations
 * - Query modules (eventQueries, venueQueries, etc.) wrap services in React Query hooks
 * - Shared services provide cross-cutting concerns (logging, error handling, etc.)
 */

// Error handling utilities
export {
  handleError,
  withErrorHandler,
  withErrorHandlerSync,
} from './errorHandler';

// Logging utilities
export { logger } from './logger';
export { logApiError, logApi } from '@force-majeure/shared';

// Environment utilities
export {
  environmentService,
  getCurrentEnvironmentName,
  getCurrentEnvironment,
  getAvailableEnvironments,
  isProduction,
  isDevelopment,
  isQA,
  type Environment,
} from './environmentService';

// Service factory for creating type-safe CRUD services
export { createService } from './createService';
export type { ServiceConfig, ServiceResult } from './createService';

// Image upload service
export { imageUploadService } from './imageUploadService';

// Role management service
export { roleManagementService } from './roleManagementService';
