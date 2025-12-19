import { describe, it, expect, vi, beforeEach } from 'vitest';
// Mock dependencies before imports
vi.mock('@/components/common/feedback/FmErrorToast', () => ({
    showErrorToast: vi.fn(),
}));
vi.mock('@/shared/utils/apiLogger', () => ({
    logApiError: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/shared/services/logger', () => ({
    logger: {
        error: vi.fn(),
    },
}));
// Import after mocking
import { handleError, withErrorHandler, withErrorHandlerSync } from './errorHandler';
import { showErrorToast } from '@/components/common/feedback/FmErrorToast';
import { logApiError } from '@/shared';
import { logger } from '@/shared';
describe('errorHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('handleError', () => {
        it('should log error with context', async () => {
            const error = new Error('Test error');
            await handleError(error, {
                title: 'Operation Failed',
                context: 'Testing error handler',
            });
            expect(logger.error).toHaveBeenCalledWith('[ErrorHandler] Operation Failed:', { error });
            expect(logger.error).toHaveBeenCalledWith('[ErrorHandler] Context: Testing error handler');
        });
        it('should show toast with appropriate message', async () => {
            const error = new Error('Database connection failed');
            await handleError(error, {
                title: 'Save Failed',
                description: 'Could not save your changes',
            });
            expect(showErrorToast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Save Failed',
            }));
        });
        it('should call logApiError with correct params', async () => {
            const error = new Error('API error');
            await handleError(error, {
                title: 'API Request Failed',
                endpoint: '/api/users',
                method: 'POST',
                context: 'Creating user',
            });
            expect(logApiError).toHaveBeenCalledWith(expect.objectContaining({
                level: 'error',
                source: 'client',
                endpoint: '/api/users',
                method: 'POST',
            }));
        });
        it('should not show toast when showToast is false', async () => {
            const error = new Error('Silent error');
            await handleError(error, {
                title: 'Silent Failure',
                showToast: false,
            });
            expect(showErrorToast).not.toHaveBeenCalled();
        });
        it('should not log when logError is false', async () => {
            const error = new Error('No logging');
            await handleError(error, {
                title: 'No Log',
                logError: false,
            });
            expect(logApiError).not.toHaveBeenCalled();
        });
        it('should handle string errors', async () => {
            await handleError('String error message', {
                title: 'String Error',
            });
            expect(showErrorToast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'String Error',
            }));
        });
        it('should handle unknown error types', async () => {
            await handleError({ weird: 'object' }, {
                title: 'Unknown Error',
            });
            expect(showErrorToast).toHaveBeenCalled();
        });
        describe('network error detection', () => {
            it('should identify "failed to fetch" as network error', async () => {
                const error = new Error('failed to fetch');
                await handleError(error, {
                    title: 'Network Error',
                });
                // Should not try to log API error for network errors
                expect(logApiError).not.toHaveBeenCalled();
            });
            it('should identify "network request failed" as network error', async () => {
                const error = new Error('Network request failed');
                await handleError(error, {
                    title: 'Network Error',
                });
                expect(logApiError).not.toHaveBeenCalled();
            });
            it('should identify "connection refused" as network error', async () => {
                const error = new Error('ECONNREFUSED');
                await handleError(error, {
                    title: 'Connection Error',
                });
                expect(logApiError).not.toHaveBeenCalled();
            });
            it('should identify "timeout" as network error', async () => {
                const error = new Error('Request timeout');
                await handleError(error, {
                    title: 'Timeout Error',
                });
                expect(logApiError).not.toHaveBeenCalled();
            });
        });
        describe('Supabase error handling', () => {
            it('should handle PostgrestError format', async () => {
                const error = {
                    message: 'Row not found',
                    details: 'No rows returned by a query',
                    code: 'PGRST116',
                };
                await handleError(error, {
                    title: 'Not Found',
                });
                expect(showErrorToast).toHaveBeenCalledWith(expect.objectContaining({
                    title: 'Not Found',
                }));
            });
            it('should handle HTTP response errors', async () => {
                const error = {
                    status: 404,
                    statusText: 'Not Found',
                    body: { error: 'Resource not found' },
                };
                await handleError(error, {
                    title: 'HTTP Error',
                });
                expect(showErrorToast).toHaveBeenCalled();
            });
        });
        describe('developer vs user display', () => {
            it('should show detailed info for developers', async () => {
                const error = new Error('Detailed error with stack');
                await handleError(error, {
                    title: 'Dev Error',
                    userRole: 'developer',
                });
                expect(showErrorToast).toHaveBeenCalledWith(expect.objectContaining({
                    isDeveloper: true,
                }));
            });
            it('should show detailed info for admins', async () => {
                const error = new Error('Admin sees details');
                await handleError(error, {
                    title: 'Admin Error',
                    userRole: 'admin',
                });
                expect(showErrorToast).toHaveBeenCalledWith(expect.objectContaining({
                    isDeveloper: true,
                }));
            });
            it('should show limited info for regular users', async () => {
                const error = new Error('User-friendly error');
                await handleError(error, {
                    title: 'User Error',
                    userRole: 'user',
                });
                expect(showErrorToast).toHaveBeenCalledWith(expect.objectContaining({
                    isDeveloper: false,
                }));
            });
            it('should show limited info when no role provided', async () => {
                const error = new Error('No role error');
                await handleError(error, {
                    title: 'Anonymous Error',
                });
                expect(showErrorToast).toHaveBeenCalledWith(expect.objectContaining({
                    isDeveloper: false,
                }));
            });
        });
    });
    describe('withErrorHandler', () => {
        it('should return result on success', async () => {
            const successFn = async () => ({ data: 'success' });
            const result = await withErrorHandler(successFn, {
                title: 'Operation',
            });
            expect(result).toEqual({ data: 'success' });
        });
        it('should catch and handle errors', async () => {
            const failFn = async () => {
                throw new Error('Function failed');
            };
            const result = await withErrorHandler(failFn, {
                title: 'Operation Failed',
            });
            expect(result).toBeNull();
            expect(showErrorToast).toHaveBeenCalled();
        });
        it('should return null on error', async () => {
            const failFn = async () => {
                throw new Error('Oops');
            };
            const result = await withErrorHandler(failFn, {
                title: 'Failed',
            });
            expect(result).toBeNull();
        });
    });
    describe('withErrorHandlerSync', () => {
        it('should return result on success', () => {
            const successFn = () => 42;
            const result = withErrorHandlerSync(successFn, {
                title: 'Sync Operation',
            });
            expect(result).toBe(42);
        });
        it('should catch errors and return null', () => {
            const failFn = () => {
                throw new Error('Sync failure');
            };
            const result = withErrorHandlerSync(failFn, {
                title: 'Sync Failed',
            });
            expect(result).toBeNull();
            // Note: handleError is async so showErrorToast may be called asynchronously
            // We just verify the function returns null on error
        });
        it('should return null on error', () => {
            const failFn = () => {
                throw new Error('Sync error');
            };
            const result = withErrorHandlerSync(failFn, {
                title: 'Failed',
            });
            expect(result).toBeNull();
        });
    });
    describe('error message extraction', () => {
        it('should extract message from Error object', async () => {
            const error = new Error('Specific error message');
            await handleError(error, {
                title: 'Error Test',
            });
            expect(logApiError).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Specific error message'),
            }));
        });
        it('should use default message for unknown error types', async () => {
            await handleError(undefined, {
                title: 'Unknown',
            });
            expect(showErrorToast).toHaveBeenCalled();
        });
        it('should handle null error', async () => {
            await handleError(null, {
                title: 'Null Error',
            });
            expect(showErrorToast).toHaveBeenCalled();
        });
    });
});
