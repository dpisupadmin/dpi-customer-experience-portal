import { createClient } from '@supabase/supabase-js';

let client;

export function getSupabaseAdmin(){
  if(client) return client;

  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if(!url) throw new Error('SUPABASE_URL is not configured.');
  if(!secret) throw new Error('SUPABASE_SECRET_KEY is not configured.');

  client = createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'dpi-customer-experience-portal/3B'
      }
    }
  });

  return client;
}

export async function checkDatabaseConnection(){
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('companies')
    .select('id, name, code')
    .eq('code', 'DPI')
    .limit(1);

  if(error) throw error;

  return {
    connected: true,
    dpiCompanyFound: Array.isArray(data) && data.length === 1
  };
}
