import { createClient } from '@supabase/supabase-js'

// CKR-GEM: This file initializes the Supabase client.
// It is crucial for connecting the front-end application to the database.
// As per KF_06, API keys must be stored in environment variables.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Error handling for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in .env file");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

