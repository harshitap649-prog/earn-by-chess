import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_shared/cors';

export async function healthHandler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  return res.json({ 
    ok: true, 
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
}

export default healthHandler;

