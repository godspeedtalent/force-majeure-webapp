/**
 * Shared Services
 *
 * Services that are reusable across multiple features
 */

// Re-export existing services
export {
  handleError,
  withErrorHandler,
  withErrorHandlerSync,
} from './errorHandler';
export { logApiError, logApi } from '@/shared/utils/apiLogger';

// Example:
// export { apiClient } from './apiClient';
// export { storageService } from './storage';
