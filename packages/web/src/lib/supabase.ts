import {
  createSupabaseClient,
  setSupabaseInstance,
  type StorageAdapter,
  type SupabaseConfig,
} from '@force-majeure/shared';

// Web storage adapter (uses localStorage)
const webStorage: StorageAdapter = {
  getItem: async (key: string) => {
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    localStorage.removeItem(key);
  },
};

// Supabase config from environment
const config: SupabaseConfig = {
  url:
    import.meta.env.VITE_SUPABASE_URL ||
    'https://orgxcrnnecblhuxjfruy.supabase.co',
  anonKey:
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ3hjcm5uZWNibGh1eGpmcnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzczNTMsImV4cCI6MjA3MTMxMzM1M30.e7vld2VC8gcTgHulW9LnkHjjfz9dvqiK9NZ3eLkdUUo',
};

// Initialize Supabase client
const supabaseClient = createSupabaseClient(config, webStorage);
setSupabaseInstance(supabaseClient);

export { supabaseClient as supabase };
