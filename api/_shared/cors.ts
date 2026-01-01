import { VercelResponse } from '@vercel/node';
import { CONFIG } from '../../config';

export function setCorsHeaders(res: VercelResponse) {
  const origin = CONFIG.corsOrigin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export function handleOptions(res: VercelResponse) {
  setCorsHeaders(res);
  return res.status(200).end();
}

