// Dynamic wallet route - handles /api/wallet/deposit
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../../db';
import { getWallet } from '../../services/wallet';
import { verifyAuth, sendUnauthorized } from '../_shared/auth';
import { setCorsHeaders, handleOptions } from '../_shared/cors';

const depositSchema = z.object({
  amount: z.number().positive(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  const slug = req.query.slug as string;
  const user = await verifyAuth(req);
  
  if (!user) {
    return sendUnauthorized(res);
  }

  // Deposit
  if (slug === 'deposit' && req.method === 'POST') {
    try {
      const parsed = depositSchema.parse(req.body);
      const wallet = await prisma.wallet.update({
        where: { userId: user.id },
        data: {
          balance: { increment: parsed.amount },
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'DEPOSIT',
          amount: parsed.amount,
          description: `Deposit of ₹${parsed.amount}`,
        },
      });

      return res.json({
        balance: Number(wallet.balance),
        message: 'Deposit successful',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(500).json({ error: error.message || 'Failed to deposit' });
    }
  }

  return res.status(404).json({ error: 'Route not found' });
}

