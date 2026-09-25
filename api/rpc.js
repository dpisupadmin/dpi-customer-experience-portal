import { setCors, json, readJsonBody } from '../lib/http.js';
import { isAllowedMethod } from '../lib/methods.js';
import { submitCustomerSurvey } from '../lib/customer-surveys.js';
import { requestAdminOtp, verifyAdminOtp } from '../lib/admin-auth.js';

export default async function handler(req, res){
  setCors(req, res);
  if(req.method === 'OPTIONS') return res.status(204).end();
  if(req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed.' });

  let body;
  try { body = await readJsonBody(req); }
  catch (_) { return json(res, 400, { ok:false, error:'Invalid JSON request.' }); }

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

    if(method === 'adminRequestOtp'){
      const input = args[0];
      const email = typeof input === 'string' ? input : input?.email || input?.adminEmail;
      const result = await requestAdminOtp(email);
      return json(res, 200, { ok:true, result });
    }

    if(method === 'adminVerifyOtp'){
      const input = args[0] || {};
      const email = typeof input === 'object' ? (input.email || input.adminEmail) : args[0];
      const token = typeof input === 'object' ? (input.otp || input.code || input.token) : args[1];
      const result = await verifyAdminOtp(email, token);
      return json(res, 200, { ok:true, result });
    }

    return json(res, 501, {
      ok:false,
      error:`Standalone operation "${method}" is not implemented yet.`,
      stage:'3E'
    });
  } catch(error){
    console.error(`RPC ${method} failed:`, error?.message || error);
    return json(res, 400, { ok:false, error:error?.message || 'The request could not be completed.' });
  }
}
