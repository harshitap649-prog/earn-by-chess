import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../db';
import { verifyAuth, sendUnauthorized } from './_shared/auth';
import { setCorsHeaders, handleOptions } from './_shared/cors';

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

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(userData);
  } catch (error: any) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get profile' });
  }
}

