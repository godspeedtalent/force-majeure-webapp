// Simple logging utilities for API calls and errors
interface LogParams {
  endpoint: string;
  method: string;
  message: string;
  details?: any;
  status?: number;
}

export const logApi = async (params: LogParams): Promise<void> => {
  console.log(`[API] ${params.method} ${params.endpoint}: ${params.message}`, params.details || '');
};

export const logApiError = async (params: LogParams): Promise<void> => {
  console.error(`[API ERROR] ${params.method} ${params.endpoint}: ${params.message}`, params.details || '');
};