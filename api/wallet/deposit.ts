import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../../../db';
import { verifyAuth, sendUnauthorized } from '../../_shared/auth';
import { setCorsHeaders, handleOptions } from '../../_shared/cors';

const depositSchema = z.object({
  amount: z.number().positive(),
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

    const parsed = depositSchema.parse(req.body);

    // Update wallet
    const wallet = await prisma.wallet.update({
      where: { userId: user.id },
      data: {
        balance: { increment: parsed.amount },
      },
    });

    // Create transaction
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
    console.error('Deposit error:', error);
    return res.status(500).json({ error: error.message || 'Failed to deposit' });
  }
}

