import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../../config';
import { prisma } from '../../db';

export interface AuthedVercelRequest extends VercelRequest {
  user?: { id: string };
}

export async function verifyAuth(req: VercelRequest): Promise<{ id: string } | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, CONFIG.jwtSecret) as { userId: string };

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return null;
      }

      return { id: user.id };
    } catch (dbError: any) {
      // If database is not connected, still allow auth based on JWT
      // This prevents 500 errors when DATABASE_URL is not set
      console.warn('Database error in auth verification, using JWT only:', dbError.message);
      return { id: decoded.userId };
    }
  } catch (error) {
    return null;
  }
}

export function sendUnauthorized(res: VercelResponse) {
  return res.status(401).json({ error: 'Unauthorized' });
}

