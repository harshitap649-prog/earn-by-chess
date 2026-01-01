import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../../../db';
import { completeMatch } from '../../../services/match';
import { verifyAuth, sendUnauthorized } from '../../_shared/auth';
import { setCorsHeaders, handleOptions } from '../../_shared/cors';

const completeMatchSchema = z.object({
  winnerId: z.string().optional(),
  isDraw: z.boolean().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyAuth(req);
    if (!user) {
      return sendUnauthorized(res);
    }

    const { id } = req.query;
    const parsed = completeMatchSchema.parse(req.body);

    // Get match to find opponent
    const matchData = await prisma.match.findUnique({
      where: { id: id as string },
    });

    if (!matchData) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (!matchData.opponentId) {
      return res.status(400).json({ error: 'Match not fully joined' });
    }

    // Determine winner and loser
    let winnerId: string;
    let loserId: string;

    if (parsed.isDraw) {
      // For draw, refund both - we'll handle this in the service
      // But completeMatch expects winnerId and loserId, so we'll use a special case
      // Actually, let's handle draw separately
      const entryFee = Number(matchData.entryFee);
      
      if (entryFee > 0) {
        // Refund both players
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
        where: { id: id as string },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      return res.json(completedMatch);
    }

    // Determine winner and loser
    if (parsed.winnerId) {
      winnerId = parsed.winnerId;
      loserId = winnerId === matchData.creatorId ? matchData.opponentId : matchData.creatorId;
    } else {
      // Default: current user is winner (for now)
      winnerId = user.id;
      loserId = user.id === matchData.creatorId ? matchData.opponentId : matchData.creatorId;
    }

    const match = await completeMatch(
      id as string,
      winnerId,
      loserId
    );

    return res.json(match);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Complete match error:', error);
    return res.status(400).json({ error: error.message || 'Failed to complete match' });
  }
}

