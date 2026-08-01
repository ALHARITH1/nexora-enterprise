import { createClient } from '@supabase/supabase-js';

window.NEXORA = window.NEXORA || {};

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';

let supabase = null;
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('إعدادات الاتصال بقاعدة البيانات مفقودة (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). يرجى التحقق من المتغيرات البيئية.');
}

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (err) {
  console.warn('[Supabase] Initialization failed:', err.message);
  throw err;
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
