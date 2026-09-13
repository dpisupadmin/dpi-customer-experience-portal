import { setCors, json, readJsonBody } from '../lib/http.js';
import { isAllowedMethod } from '../lib/methods.js';
import { submitCustomerSurvey } from '../lib/customer-surveys.js';

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

  try {
    if(method === 'submitCustomerSurvey'){
      if(args.length !== 1 || !args[0] || typeof args[0] !== 'object'){
        return json(res, 400, { ok:false, error:'Customer survey payload is missing.' });
      }

      const result = await submitCustomerSurvey(args[0]);
      return json(res, 200, { ok:true, result });
    }

    return json(res, 501, {
      ok: false,
      error: `Standalone operation "${method}" is not implemented yet.`,
      stage: '3C'
    });
  } catch(error){
    console.error(`RPC ${method} failed:`, error?.message || error);
    return json(res, 400, {
      ok: false,
      error: error?.message || 'The request could not be completed.'
    });
  }
}
