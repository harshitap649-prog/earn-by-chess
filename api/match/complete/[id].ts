import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
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

    const match = await completeMatch(
      id as string,
      user.id,
      parsed.winnerId,
      parsed.isDraw
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

