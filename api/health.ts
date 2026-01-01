import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_shared/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  return res.json({ 
    ok: true, 
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
}

