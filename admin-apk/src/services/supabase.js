// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL        = 'https://lrwyirzxmjsrjtmvdjry.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxyd3lpcnp4bWpzcmp0bXZkanJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQ2MjI1NCwiZXhwIjoyMDk4MDM4MjU0fQ.7A7LIc9cZfH3GU8cQg5qjPfbKwBtajbMkCxDngBo2V0'; // admin key — never expose to frontend

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth:    { storage: AsyncStorage, autoRefreshToken: true, persistSession: true },
  global:  { headers: { 'x-client': 'cardvalidator-admin' } },
  realtime:{ params: { eventsPerSecond: 10 } },
});

// ── Fetch recent validations ──────────────────────────────────
export async function fetchValidations({ limit = 50, status = null } = {}) {
  let q = supabase
    .from('card_validations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// ── Fetch stats ───────────────────────────────────────────────
export async function fetchStats() {
  const { data, error } = await supabase.rpc('get_validation_stats');
  if (error) {
    // fallback: count manually
    const { data: rows } = await supabase.from('card_validations').select('status');
    const total   = rows?.length || 0;
    const valid   = rows?.filter(r => r.status === 'valid').length || 0;
    const used    = rows?.filter(r => r.status === 'used').length || 0;
    const invalid = rows?.filter(r => r.status === 'invalid').length || 0;
    return { total, valid, used, invalid };
  }
  return data;
}

// ── Subscribe to realtime inserts ─────────────────────────────
export function subscribeToValidations(onInsert) {
  return supabase
    .channel('admin-validations')
    .on('postgres_changes', {
      event:  'INSERT',
      schema: 'public',
      table:  'card_validations',
    }, payload => onInsert(payload.new))
    .subscribe();
}
