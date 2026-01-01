// Base withdraw route - handles /api/withdraw (POST)
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '../db';
import { CONFIG } from '../config';
import { getWallet } from '../services/wallet';
import { verifyAuth, sendUnauthorized } from './_shared/auth';
import { setCorsHeaders, handleOptions } from './_shared/cors';

const withdrawSchema = z.object({
  amount: z.number().min(CONFIG.minWithdraw),
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

    const parsed = withdrawSchema.parse(req.body);
    const wallet = await getWallet(user.id);
    
    if (Number(wallet.balance) < parsed.amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await prisma.withdrawRequest.findFirst({
      where: {
        userId: user.id,
        status: 'pending',
        requestedAt: { gte: today },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'One withdrawal per day allowed' });
    }

    await prisma.wallet.update({
      where: { userId: user.id },
      data: {
        balance: { decrement: parsed.amount },
        lockedBalance: { increment: parsed.amount },
      },
    });

    const request = await prisma.withdrawRequest.create({
      data: {
        userId: user.id,
        amount: parsed.amount,
        status: 'pending',
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: parsed.amount,
        type: 'WITHDRAW',
        description: `Withdrawal request of ₹${parsed.amount}`,
      },
    });

    return res.json(request);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Withdraw error:', error);
    return res.status(400).json({ error: error.message || 'Failed to withdraw' });
  }
}
