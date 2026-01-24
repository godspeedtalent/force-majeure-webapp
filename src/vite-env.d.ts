/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_PROJECT_ID: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_SPOTIFY_CLIENT_ID?: string;
  /**
   * Enable debug logging for local development.
   * When set to 'true', all debug/info/warn logs will be visible regardless of user role.
   * This should ONLY be set in .env.local (which is gitignored) - never committed.
   * @example VITE_DEBUG_MODE=true
   */
  readonly VITE_DEBUG_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
