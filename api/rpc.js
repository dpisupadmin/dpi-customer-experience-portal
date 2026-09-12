import { setCors, json, readJsonBody } from '../lib/http.js';
import { isAllowedMethod } from '../lib/methods.js';

export default async function handler(req, res){
  setCors(req, res);
  if(req.method === 'OPTIONS') return res.status(204).end();
  if(req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed.' });

  let body;
  try {
    body = await readJsonBody(req);
  } catch (_) {
    return json(res, 400, { ok:false, error:'Invalid JSON request.' });
  }

  const method = String(body.method || '').trim();
  const args = Array.isArray(body.args) ? body.args : [];

  if(!isAllowedMethod(method)){
    return json(res, 404, { ok:false, error:'Unknown portal operation.' });
  }

  // Stage 3A intentionally stops here. Stages 3B onward replace the old Google
  // backend behavior with PostgreSQL/storage/email/PDF services.
  return json(res, 501, {
    ok: false,
    error: 'Standalone operation "' + method + '" is not implemented yet. Continue with Stage 3B.',
    stage: '3A',
    receivedArgs: args.length
  });
}
