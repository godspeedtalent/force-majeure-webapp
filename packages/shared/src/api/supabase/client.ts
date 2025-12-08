import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Storage interface for platform-specific implementations
export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// Environment config interface
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Factory function to create Supabase client with platform-specific storage
export function createSupabaseClient(
  config: SupabaseConfig,
  storage: StorageAdapter
): SupabaseClient<Database> {
  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      storage: {
        getItem: async (key: string) => {
          return await storage.getItem(key);
        },
        setItem: async (key: string, value: string) => {
          await storage.setItem(key, value);
        },
        removeItem: async (key: string) => {
          await storage.removeItem(key);
        },
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

// Singleton instance (set by platform-specific initialization)
let supabaseInstance: SupabaseClient<Database> | null = null;

export function setSupabaseInstance(instance: SupabaseClient<Database>) {
  supabaseInstance = instance;
}

export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    throw new Error(
      'Supabase client not initialized. Call setSupabaseInstance() first.'
    );
  }
  return supabaseInstance;
}

// Re-export for convenience (uses proxy pattern for lazy initialization)
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    return getSupabase()[prop as keyof SupabaseClient<Database>];
  },
});
