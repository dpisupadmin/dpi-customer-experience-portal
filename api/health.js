import { setCors, json } from '../lib/http.js';

export default async function handler(req, res){
  setCors(req, res);
  if(req.method === 'OPTIONS') return res.status(204).end();
  if(req.method !== 'GET') return json(res, 405, { ok:false, error:'Method not allowed.' });

  return json(res, 200, {
    ok: true,
    service: 'DPI Customer Experience Portal API',
    stage: '3A',
    runtime: 'standalone',
    googleAppsScript: false,
    databaseConnected: false,
    timestamp: new Date().toISOString()
  });
}
