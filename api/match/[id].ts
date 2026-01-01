// Dynamic match route - handles /api/match/:id (GET)
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

    const { id } = req.query;

    try {
      const match = await prisma.match.findUnique({
        where: { id: id as string },
      });

      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      let creator = null;
      let opponent = null;

      try {
        creator = await prisma.user.findUnique({
          where: { id: match.creatorId },
          select: { id: true, name: true, email: true },
        });
      } catch (err) {
        console.error('Error fetching creator:', err);
      }

      if (match.opponentId) {
        try {
          opponent = await prisma.user.findUnique({
            where: { id: match.opponentId },
            select: { id: true, name: true, email: true },
          });
        } catch (err) {
          console.error('Error fetching opponent:', err);
        }
      }

      return res.json({
        ...match,
        creator,
        opponent,
      });
    } catch (dbError: any) {
      console.error('Database error in get match:', dbError);
      if (dbError.message?.includes('connect') || dbError.message?.includes('DATABASE_URL')) {
        return res.status(404).json({ error: 'Match not found - database not connected' });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Get match error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get match' });
  }
}

