import { VercelResponse } from '@vercel/node';
import { CONFIG } from '../../config';

export function setCorsHeaders(res: VercelResponse) {
  // In production on Vercel, allow requests from the same origin
  // Also check for CORS_ORIGIN env var or use wildcard as fallback
  let origin = '*';
  
  if (process.env.CORS_ORIGIN) {
    origin = process.env.CORS_ORIGIN;
  } else if (CONFIG.corsOrigin && CONFIG.corsOrigin !== 'http://localhost:5173') {
    origin = CONFIG.corsOrigin;
  } else if (process.env.VERCEL_URL) {
    // On Vercel, allow same origin
    origin = `https://${process.env.VERCEL_URL}`;
  }
  
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export function handleOptions(res: VercelResponse) {
  setCorsHeaders(res);
  return res.status(200).end();
}

