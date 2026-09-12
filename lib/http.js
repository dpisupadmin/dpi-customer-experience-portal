export function setCors(req, res){
  const configured = String(process.env.APP_ORIGIN || '').trim();
  const origin = req.headers.origin || '';

  if(configured){
    const allowed = configured.split(',').map(v => v.trim()).filter(Boolean);
    if(allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

export function json(res, status, payload){
  res.status(status).json(payload);
}

export async function readJsonBody(req){
  if(req.body && typeof req.body === 'object') return req.body;
  if(typeof req.body === 'string' && req.body.trim()) return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}
