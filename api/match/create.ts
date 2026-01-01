import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { createMatch } from '../../services/match';
import { verifyAuth, sendUnauthorized } from '../_shared/auth';
import { setCorsHeaders, handleOptions } from '../_shared/cors';

const createMatchSchema = z.object({
  entryFee: z.number().min(0).optional(),
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

    const parsed = createMatchSchema.parse(req.body);
    const entryFee = parsed.entryFee !== undefined ? parsed.entryFee : 10;

    const match = await createMatch(user.id, entryFee);

    return res.json(match);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create match error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create match' });
  }
}

