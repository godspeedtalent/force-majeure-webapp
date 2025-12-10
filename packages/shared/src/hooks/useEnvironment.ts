import { useQuery } from '@tanstack/react-query';
import {
  environmentService,
  type Environment,
} from '../services/environmentService';

/**
 * Hook to get current environment configuration
 * Returns the full environment object from the database
 * 
 * @returns Query result with current Environment object
 * 
 * @example
 * ```tsx
 * const { data: environment, isLoading } = useCurrentEnvironment();
 * 
 * if (environment) {
 *   console.log(`Running in ${environment.display_name}`);
 * }
 * ```
 */
export function useCurrentEnvironment() {
  return useQuery<Environment | null>({
    queryKey: ['environment', 'current'],
    queryFn: () => environmentService.getCurrentEnvironment(),
    staleTime: Infinity, // Environment doesn't change during session
  });
}

/**
 * Hook to get all available environments
 * Returns array of all active environments from database
 * 
 * @returns Query result with array of Environment objects
 * 
 * @example
 * ```tsx
 * const { data: environments, isLoading } = useAvailableEnvironments();
 * 
 * return (
 *   <select>
 *     {environments?.map(env => (
 *       <option key={env.id} value={env.id}>
 *         {env.display_name}
 *       </option>
 *     ))}
 *   </select>
 * );
 * ```
 */
export function useAvailableEnvironments() {
  return useQuery<Environment[]>({
    queryKey: ['environments', 'all'],
    queryFn: () => environmentService.getAvailableEnvironments(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get environment name synchronously
 * Returns the current environment name (dev, qa, prod) without async call
 * 
 * @returns Current environment name string
 * 
 * @example
 * ```tsx
 * const envName = useEnvironmentName();
 * 
 * return (
 *   <div>
 *     Current environment: {envName}
 *   </div>
 * );
 * ```
 */
export function useEnvironmentName(): string {
  return environmentService.getCurrentEnvironmentName();
}

/**
 * Hook to check if current environment is production
 * Convenience hook for conditional rendering based on environment
 * 
 * @returns True if current environment is 'prod'
 * 
 * @example
 * ```tsx
 * const isProduction = useIsProduction();
 * 
 * if (isProduction) {
 *   return <ProductionWarning />;
 * }
 * ```
 */
export function useIsProduction(): boolean {
  return environmentService.isProduction();
}

/**
 * Hook to check if current environment is development
 * Convenience hook for conditional rendering based on environment
 * 
 * @returns True if current environment is 'dev'
 * 
 * @example
 * ```tsx
 * const isDevelopment = useIsDevelopment();
 * 
 * if (isDevelopment) {
 *   return <DevTools />;
 * }
 * ```
 */
export function useIsDevelopment(): boolean {
  return environmentService.isDevelopment();
}

/**
 * Hook to check if current environment is QA
 * Convenience hook for conditional rendering based on environment
 * 
 * @returns True if current environment is 'qa'
 * 
 * @example
 * ```tsx
 * const isQA = useIsQA();
 * 
 * if (isQA) {
 *   return <QABanner />;
 * }
 * ```
 */
export function useIsQA(): boolean {
  return environmentService.isQA();
}
