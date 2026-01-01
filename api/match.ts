// Combined match routes - create, get, join, complete
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../db';
import { createMatch, joinMatch, completeMatch } from '../services/match';
import { verifyAuth, sendUnauthorized } from './_shared/auth';
import { setCorsHeaders, handleOptions } from './_shared/cors';

const createMatchSchema = z.object({
  entryFee: z.number().min(0).optional(),
});

const completeMatchSchema = z.object({
  winnerId: z.string().optional(),
  isDraw: z.boolean().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  const path = req.url?.split('?')[0] || '';
  const pathParts = path.split('/').filter(Boolean);
  const matchId = pathParts[pathParts.length - 1];
  const isCreate = path.includes('/create') || path.endsWith('/match/create');
  const isJoin = path.includes('/join/');
  const isComplete = path.includes('/complete/');
  const isGetMatch = !isCreate && !isJoin && !isComplete && matchId && path.includes('/match/');

  // Create match
  if (isCreate && req.method === 'POST') {
    try {
      const user = await verifyAuth(req);
      if (!user) {
        return sendUnauthorized(res);
      }

      const parsed = createMatchSchema.parse(req.body);
      const entryFee = parsed.entryFee !== undefined ? parsed.entryFee : 10;
      const match = await createMatch(user.id, entryFee);
      return res.json(match);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(500).json({ error: error.message || 'Failed to create match' });
    }
  }

  // Join match
  if (isJoin && req.method === 'POST') {
    try {
      const user = await verifyAuth(req);
      if (!user) {
        return sendUnauthorized(res);
      }

      const match = await joinMatch(matchId, user.id);
      return res.json(match);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Failed to join match' });
    }
  }

  // Complete match
  if (isComplete && req.method === 'POST') {
    try {
      const user = await verifyAuth(req);
      if (!user) {
        return sendUnauthorized(res);
      }

      const parsed = completeMatchSchema.parse(req.body);
      const matchData = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!matchData) {
        return res.status(404).json({ error: 'Match not found' });
      }

      if (!matchData.opponentId) {
        return res.status(400).json({ error: 'Match not fully joined' });
      }

      if (parsed.isDraw) {
        const entryFee = Number(matchData.entryFee);
        if (entryFee > 0) {
          await prisma.wallet.update({
            where: { userId: matchData.creatorId },
            data: {
              lockedBalance: { decrement: entryFee },
              balance: { increment: entryFee },
            },
          });
          await prisma.wallet.update({
            where: { userId: matchData.opponentId },
            data: {
              lockedBalance: { decrement: entryFee },
              balance: { increment: entryFee },
            },
          });
        }
        const completedMatch = await prisma.match.update({
          where: { id: matchId },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });
        return res.json(completedMatch);
      }

      if (!parsed.winnerId) {
        return res.status(400).json({ error: 'winnerId required for non-draw matches' });
      }

      const loserId = matchData.creatorId === parsed.winnerId ? matchData.opponentId : matchData.creatorId;
      const match = await completeMatch(matchId, parsed.winnerId, loserId);
      return res.json(match);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message || 'Failed to complete match' });
    }
  }

  // Get match by ID
  if (isGetMatch && req.method === 'GET') {
    try {
      const user = await verifyAuth(req);
      if (!user) {
        return sendUnauthorized(res);
      }

      const match = await prisma.match.findUnique({
        where: { id: matchId },
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
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to get match' });
    }
  }

  return res.status(404).json({ error: 'Route not found' });
}

