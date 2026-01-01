// Base wallet route - handles /api/wallet (GET)
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getWallet } from '../services/wallet';
import { verifyAuth, sendUnauthorized } from './_shared/auth';
import { setCorsHeaders, handleOptions } from './_shared/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyAuth(req);
    if (!user) {
      return sendUnauthorized(res);
    }

    try {
      const wallet = await getWallet(user.id);
      return res.json({
        balance: Number(wallet.balance || 0),
        lockedBalance: Number(wallet.lockedBalance || 0),
      });
    } catch (dbError: any) {
      console.error('Database error in wallet:', dbError);
      // If database is not connected, return default values instead of error
      if (dbError.message?.includes('connect') || dbError.message?.includes('DATABASE_URL')) {
        console.warn('Database not connected, returning default wallet values');
        return res.json({
          balance: 0,
          lockedBalance: 0,
        });
      }
      // For other errors, still return 500
      throw dbError;
    }
  } catch (error: any) {
    console.error('Wallet error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get wallet' });
  }
}
