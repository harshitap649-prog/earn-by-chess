import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, handleOptions } from './_shared/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  // Health check should always work, even without database
  try {
    return res.json({ 
      ok: true, 
      message: 'API is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error: any) {
    // Even if JSON serialization fails, return a simple response
    const errorMessage = error?.message || 'Unknown error';
    const errorString = typeof errorMessage === 'string' ? errorMessage : 'Unknown error';
    return res.status(500).json({ 
      ok: false,
      error: errorString,
      message: 'Health check failed'
    });
  }
}

