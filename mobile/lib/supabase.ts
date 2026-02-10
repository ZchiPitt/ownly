import { createClient } from '@supabase/supabase-js';

import type { Database } from '../../src/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Add them to your Expo env config.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
