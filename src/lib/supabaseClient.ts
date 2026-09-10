// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hvziwrrgpnlsbhiicmsc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eml3cnJncG5sc2JoaWljbXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NjE3NDgsImV4cCI6MjA5NTMzNzc0OH0.VUmkdGGya1zTJe04jrRJyL5qSsvHZSkjHK9Rx4dyEIc';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-school'));

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
