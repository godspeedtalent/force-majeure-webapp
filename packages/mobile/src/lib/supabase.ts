import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createSupabaseClient,
  setSupabaseInstance,
  type StorageAdapter,
  type SupabaseConfig,
} from '@force-majeure/shared';

// Mobile storage adapter (uses AsyncStorage)
const mobileStorage: StorageAdapter = {
  getItem: async (key: string) => {
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};

// Supabase config from environment
const config: SupabaseConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};

// Initialize Supabase client
const supabaseClient = createSupabaseClient(config, mobileStorage);
setSupabaseInstance(supabaseClient);

export { supabaseClient as supabase };
