import { VercelRequest, VercelResponse } from '@vercel/node';
import { getWallet } from '../../services/wallet';
import { verifyAuth, sendUnauthorized } from '../_shared/auth';
import { setCorsHeaders, handleOptions } from '../_shared/cors';

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

    const wallet = await getWallet(user.id);

    return res.json({
      balance: Number(wallet.balance),
      lockedBalance: Number(wallet.lockedBalance),
    });
  } catch (error: any) {
    console.error('Wallet error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get wallet' });
  }
}

