import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Web uses localStorage, native uses AsyncStorage
// SSR guard prevents window access during static export
const webStorage = {
  getItem: (k: string) => (typeof window !== 'undefined' ? localStorage.getItem(k) : null),
  setItem: (k: string, v: string) => { if (typeof window !== 'undefined') localStorage.setItem(k, v); },
  removeItem: (k: string) => { if (typeof window !== 'undefined') localStorage.removeItem(k); },
};

export const supabase = createClient(url, key, {
  auth: {
    storage: Platform.OS === 'web' ? webStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const isConfigured = () => Boolean(url && key);
