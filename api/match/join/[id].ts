import { VercelRequest, VercelResponse } from '@vercel/node';
import { joinMatch } from '../../../services/match';
import { verifyAuth, sendUnauthorized } from '../../_shared/auth';
import { setCorsHeaders, handleOptions } from '../../_shared/cors';

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
    const match = await joinMatch(id as string, user.id);

    return res.json(match);
  } catch (error: any) {
    console.error('Join match error:', error);
    return res.status(400).json({ error: error.message || 'Failed to join match' });
  }
}

