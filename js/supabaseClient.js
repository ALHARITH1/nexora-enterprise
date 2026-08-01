import { createClient } from '@supabase/supabase-js';

window.NEXORA = window.NEXORA || {};

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://demo.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo';

let supabase = null;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (err) {
  console.warn('[Supabase] Initialized in fallback mode:', err.message);
}

NEXORA.Supabase = {
  client: supabase,
  init: function(url, key) {
    if (url && key) {
      this.client = createClient(url, key);
    }
    return this.client;
  }
};

export default NEXORA.Supabase;
