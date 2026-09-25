import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res){
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if(req.method !== 'GET') return res.status(405).json({ ok:false, error:'Method not allowed.' });

  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
  let databaseConnected = false;
  let dpiCompanyFound = false;

  if(url && secret){
    try {
      const supabase = createClient(url, secret, { auth:{ persistSession:false, autoRefreshToken:false } });
      const { data, error } = await supabase.from('companies').select('id,code').eq('code','DPI').maybeSingle();
      if(!error){ databaseConnected = true; dpiCompanyFound = !!data; }
    } catch (_) {}
  }

  return res.status(databaseConnected && publishable ? 200 : 503).json({
    ok: databaseConnected && !!publishable,
    service:'DPI Customer Experience Portal API',
    stage:'3G',
    runtime:'standalone',
    googleAppsScript:false,
    databaseConnected,
    databaseStatus: databaseConnected ? 'connected' : 'unavailable',
    dpiCompanyFound,
    features:{
      customerSurveySubmission:true,
      ucuaObservationSubmission:true,
      mySubmissionsEmailOtp:true,
      anonymousTracking:false,
      adminEmailOtp:!!publishable,
      supabaseAuth:true,
      adminDashboard:true,
      adminCustomerSurveys:true,
      adminAuditLog:true,
      customerSurveyEmail:false,
      customerSurveyPdf:false
    },
    timestamp:new Date().toISOString()
  });
}
