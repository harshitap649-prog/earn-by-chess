// Match create route - handles /api/match/create
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

    try {
      const match = await createMatch(user.id, entryFee);
      return res.json(match);
    } catch (dbError: any) {
      console.error('Database error in create match:', dbError);
      const errorMessage = dbError?.message || 'Unknown database error';
      const errorString = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      
      // If database is not connected, return a helpful error
      if (errorString.includes('connect') || errorString.includes('DATABASE_URL') || errorString.includes('Can\'t reach database') || errorString.includes('P1001')) {
        return res.status(503).json({ 
          error: 'Database not available',
          details: 'The database connection is not configured. Please check DATABASE_URL environment variable.'
        });
      }
      // For other database errors, return 500 with safe error message
      return res.status(500).json({ 
        error: errorString || 'Failed to create match',
        details: 'An error occurred while creating the match'
      });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create match error:', error);
    const errorMessage = error?.message || 'Failed to create match';
    const errorString = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
    return res.status(500).json({ 
      error: errorString,
      details: 'An unexpected error occurred'
    });
  }
}

