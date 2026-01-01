import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../db';
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
    const matches = await prisma.match.findMany({
      where: {
        status: 'waiting',
        opponentId: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // Get creator info separately
    const matchesWithCreators = await Promise.all(
      matches.map(async (match: any) => {
        try {
          const creator = await prisma.user.findUnique({
            where: { id: match.creatorId },
            select: {
              id: true,
              name: true,
              email: true,
            },
          });
          return {
            ...match,
            creator: creator || null,
          };
        } catch (err) {
          return {
            ...match,
            creator: null,
          };
        }
      })
    );

    return res.json(matchesWithCreators);
  } catch (error: any) {
    console.error('Matches error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get matches' });
  }
}

