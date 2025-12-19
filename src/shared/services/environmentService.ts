import { supabase } from '@/shared';
import { logger } from './logger';

const envLogger = logger.createNamespace('Environment');

/**
 * Environment configuration interface
 */
export interface Environment {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Environment service class
 * Provides centralized environment detection and management
 * 
 * CRITICAL: All environment detection must go through this service.
 * Never hard-code environment strings in application code.
 * 
 * Environment is determined by:
 * 1. VITE_ENVIRONMENT variable in .env (primary source)
 * 2. Hostname detection (fallback for deployed environments)
 * 3. Default to 'dev' (safety fallback)
 */
class EnvironmentService {
  private currentEnvironmentName: string | null = null;
  private currentEnvironment: Environment | null = null;
  private availableEnvironments: Environment[] | null = null;

  /**
   * Get current environment name from .env variable
   * Priority: ENV variable > hostname detection > default
   * 
   * @returns {string} Current environment name (dev, qa, prod)
   */
  getCurrentEnvironmentName(): string {
    if (this.currentEnvironmentName) {
      return this.currentEnvironmentName;
    }

    // 1. Check explicit ENV variable (primary source)
    const envVar = import.meta.env.VITE_ENVIRONMENT;
    if (envVar) {
      this.currentEnvironmentName = envVar;
      envLogger.info('Environment from VITE_ENVIRONMENT:', envVar);
      return envVar;
    }

    // 2. Fallback: Detect from hostname (for deployed environments without ENV)
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      this.currentEnvironmentName = 'dev';
      envLogger.info('Environment detected from hostname: dev');
    } else if (hostname.includes('qa') || hostname.includes('staging')) {
      this.currentEnvironmentName = 'qa';
      envLogger.info('Environment detected from hostname: qa');
    } else if (hostname.includes('forcemajeure')) {
      this.currentEnvironmentName = 'prod';
      envLogger.info('Environment detected from hostname: prod');
    } else {
      // 3. Default to dev for safety
      this.currentEnvironmentName = 'dev';
      envLogger.warn('Could not detect environment, defaulting to dev');
    }

    return this.currentEnvironmentName;
  }

  /**
   * Get current environment object from database
   * Includes full environment configuration (id, display_name, etc.)
   * 
   * @returns {Promise<Environment | null>} Current environment object or null if error
   */
  async getCurrentEnvironment(): Promise<Environment | null> {
    if (this.currentEnvironment) {
      return this.currentEnvironment;
    }

    try {
      const envName = this.getCurrentEnvironmentName();
      const { data, error } = await supabase
        .from('environments')
        .select('*')
        .eq('name', envName)
        .single();

      if (error) throw error;

      this.currentEnvironment = data as Environment;
      envLogger.debug('Current environment loaded:', this.currentEnvironment);
      return this.currentEnvironment;
    } catch (error) {
      envLogger.error('Failed to fetch current environment:', { error });
      return null;
    }
  }

  /**
   * Get all available environments from database
   * Only returns active environments, ordered by name
   * 
   * @returns {Promise<Environment[]>} Array of available environments
   */
  async getAvailableEnvironments(): Promise<Environment[]> {
    if (this.availableEnvironments) {
      return this.availableEnvironments;
    }

    try {
      const { data, error } = await supabase
        .from('environments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      this.availableEnvironments = (data as Environment[]) || [];
      envLogger.debug(
        'Available environments loaded:',
        this.availableEnvironments.map(e => e.name)
      );
      return this.availableEnvironments;
    } catch (error) {
      envLogger.error('Failed to fetch available environments:', { error });
      return [];
    }
  }

  /**
   * Get environment by name
   * Useful for admin interfaces that need to query specific environments
   * 
   * @param {string} name - Environment name to fetch
   * @returns {Promise<Environment | null>} Environment object or null if not found
   */
  async getEnvironmentByName(name: string): Promise<Environment | null> {
    try {
      const { data, error } = await supabase
        .from('environments')
        .select('*')
        .eq('name', name)
        .single();

      if (error) throw error;
      return data as Environment;
    } catch (error) {
      envLogger.error(`Failed to fetch environment ${name}:`, { error });
      return null;
    }
  }

  /**
   * Check if current environment is production
   * 
   * @returns {boolean} True if current environment is 'prod'
   */
  isProduction(): boolean {
    return this.getCurrentEnvironmentName() === 'prod';
  }

  /**
   * Check if current environment is development
   * 
   * @returns {boolean} True if current environment is 'dev'
   */
  isDevelopment(): boolean {
    return this.getCurrentEnvironmentName() === 'dev';
  }

  /**
   * Check if current environment is QA
   * 
   * @returns {boolean} True if current environment is 'qa'
   */
  isQA(): boolean {
    return this.getCurrentEnvironmentName() === 'qa';
  }

  /**
   * Clear cached environment data
   * Useful for testing or when environment changes during runtime
   */
  clearCache(): void {
    this.currentEnvironmentName = null;
    this.currentEnvironment = null;
    this.availableEnvironments = null;
    envLogger.debug('Environment cache cleared');
  }
}

// Export singleton instance
export const environmentService = new EnvironmentService();

// Export convenience functions
export const getCurrentEnvironmentName = () =>
  environmentService.getCurrentEnvironmentName();
export const getCurrentEnvironment = () =>
  environmentService.getCurrentEnvironment();
export const getAvailableEnvironments = () =>
  environmentService.getAvailableEnvironments();
export const isProduction = () => environmentService.isProduction();
export const isDevelopment = () => environmentService.isDevelopment();
export const isQA = () => environmentService.isQA();
