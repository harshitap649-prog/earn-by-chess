import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../db';
import { CONFIG } from '../../config';
import { setCorsHeaders, handleOptions } from '../_shared/cors';

const firebaseAuthSchema = z.object({
  firebaseUid: z.string(),
  email: z.string().email(),
  name: z.string().min(2),
  idToken: z.string().optional(),
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
    const parsed = firebaseAuthSchema.parse(req.body);

    // Check if user exists by Firebase UID first
    let user = await prisma.user.findUnique({
      where: { id: parsed.firebaseUid },
    });

    if (user) {
      // User exists, update if needed
      if (user.name !== parsed.name || user.email !== parsed.email) {
        user = await prisma.user.update({
          where: { id: parsed.firebaseUid },
          data: {
            name: parsed.name,
            email: parsed.email,
          },
        });
      }
    } else {
      // Check if user exists with this email
      const existingUser = await prisma.user.findUnique({
        where: { email: parsed.email },
      });

      if (existingUser) {
        user = existingUser;
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            id: parsed.firebaseUid,
            name: parsed.name,
            email: parsed.email,
            passwordHash: null,
          },
        });

        // Create wallet
        await prisma.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
            lockedBalance: 0,
          },
        });
      }
    }

    const token = jwt.sign({ userId: user.id }, CONFIG.jwtSecret, {
      expiresIn: '7d',
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Firebase auth error:', error);
    return res.status(500).json({ error: error.message || 'Firebase auth failed' });
  }
}

