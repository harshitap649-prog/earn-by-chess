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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return null;
    }

    return { id: user.id };
  } catch (error) {
    return null;
  }
}

export function sendUnauthorized(res: VercelResponse) {
  return res.status(401).json({ error: 'Unauthorized' });
}

