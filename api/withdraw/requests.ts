// Withdraw requests route - handles /api/withdraw/requests
import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../db';
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

    try {
      const requests = await prisma.withdrawRequest.findMany({
        where: { userId: user.id },
        orderBy: { requestedAt: 'desc' },
        take: 20,
      });

      return res.json(requests);
    } catch (dbError: any) {
      console.warn('Database error in withdraw requests, returning empty array:', dbError.message);
      return res.json([]);
    }
  } catch (error: any) {
    console.error('Withdraw requests error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get withdraw requests' });
  }
}

