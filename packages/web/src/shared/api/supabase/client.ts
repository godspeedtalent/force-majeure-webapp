import { createClient } from '@supabase/supabase-js';

import type { Database } from './types';

// Load configuration - hardcoded since these are publishable keys
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://orgxcrnnecblhuxjfruy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ3hjcm5uZWNibGh1eGpmcnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzczNTMsImV4cCI6MjA3MTMxMzM1M30.e7vld2VC8gcTgHulW9LnkHjjfz9dvqiK9NZ3eLkdUUo';

// Import the supabase client like this:
// import { supabase } from "@/shared/api/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
