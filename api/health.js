import { setCors, json } from '../lib/http.js';
import { checkDatabaseConnection } from '../lib/supabase.js';

export default async function handler(req, res){
  setCors(req, res);

  if(req.method === 'OPTIONS') return res.status(204).end();
  if(req.method !== 'GET') return json(res, 405, {
    ok: false,
    error: 'Method not allowed.'
  });

  let databaseConnected = false;
  let databaseStatus = 'unavailable';
  let dpiCompanyFound = false;

  try {
    const result = await checkDatabaseConnection();
    databaseConnected = result.connected === true;
    dpiCompanyFound = result.dpiCompanyFound === true;
    databaseStatus = databaseConnected ? 'connected' : 'unavailable';
  } catch (error) {
    console.error('Database health check failed:', error?.message || error);
  }

  return json(res, databaseConnected ? 200 : 503, {
    ok: databaseConnected,
    service: 'DPI Customer Experience Portal API',
    stage: '3B',
    runtime: 'standalone',
    googleAppsScript: false,
    databaseConnected,
    databaseStatus,
    dpiCompanyFound,
    timestamp: new Date().toISOString()
  });
}
