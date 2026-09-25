import { createClient } from '@supabase/supabase-js';

function env(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function authClient() {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_PUBLISHABLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

function adminClient() {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

async function getAuthorizedAdmin(email) {
  const db = adminClient();
  const { data, error } = await db
    .from('admins')
    .select('id,email,display_name,role,is_active')
    .ilike('email', email)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw new Error(`Unable to check administrator access: ${error.message}`);
  return data || null;
}

export async function requestAdminOtp(emailInput) {
  const email = normalizeEmail(emailInput);
  if (!email) throw new Error('Admin email is required.');

  const admin = await getAuthorizedAdmin(email);

  // Keep the response generic so the endpoint does not reveal which addresses
  // are registered administrators.
  const generic = {
    requested: true,
    message: 'If this email is an authorized administrator, a verification code will be sent.'
  };

  if (!admin) return generic;

  const supabase = authClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true
    }
  });

  if (error) throw new Error(`Unable to send verification code: ${error.message}`);
  return generic;
}

export async function verifyAdminOtp(emailInput, tokenInput) {
  const email = normalizeEmail(emailInput);
  const token = String(tokenInput || '').trim();

  if (!email || !token) throw new Error('Email and verification code are required.');

  // Check authorization before verification and again after verification.
  const before = await getAuthorizedAdmin(email);
  if (!before) throw new Error('Invalid or expired verification code.');

  const supabase = authClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  });

  if (error || !data?.session || !data?.user) {
    throw new Error('Invalid or expired verification code.');
  }

  const verifiedEmail = normalizeEmail(data.user.email);
  const admin = await getAuthorizedAdmin(verifiedEmail);
  if (!admin || verifiedEmail !== email) {
    await supabase.auth.signOut();
    throw new Error('Administrator access is not authorized.');
  }

  return {
    authenticated: true,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
    admin: {
      email: admin.email,
      displayName: admin.display_name,
      role: admin.role
    }
  };
}
