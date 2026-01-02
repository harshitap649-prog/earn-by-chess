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
        // Continue without creator info
      }

      if (match.opponentId) {
        try {
          opponent = await prisma.user.findUnique({
            where: { id: match.opponentId },
            select: { id: true, name: true, email: true },
          });
        } catch (err) {
          console.error('Error fetching opponent:', err);
          // Continue without opponent info
        }
      }

      return res.json({
        ...match,
        creator: creator || { id: match.creatorId, name: 'Unknown', email: '' },
        opponent: opponent || (match.opponentId ? { id: match.opponentId, name: 'Unknown', email: '' } : null),
      });
    } catch (dbError: any) {
      console.error('Database error in get match:', dbError);
      const errorMessage = dbError?.message || 'Unknown database error';
      const errorString = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      
      if (errorString.includes('connect') || errorString.includes('DATABASE_URL') || errorString.includes('Can\'t reach database') || errorString.includes('P1001')) {
        return res.status(503).json({ 
          error: 'Database not available',
          details: 'The database connection is not configured. Please check DATABASE_URL environment variable.'
        });
      }
      // For other database errors, return 500 with safe error message
      return res.status(500).json({ 
        error: errorString || 'Failed to get match',
        details: 'An error occurred while fetching match data'
      });
    }
  } catch (error: any) {
    console.error('Get match error:', error);
    const errorMessage = error?.message || 'Failed to get match';
    const errorString = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
    return res.status(500).json({ 
      error: errorString,
      details: 'An unexpected error occurred'
    });
  }
}

