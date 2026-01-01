import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../../db';
import { CONFIG } from '../../config';
import { verifyAuth, sendUnauthorized } from '../_shared/auth';
import { setCorsHeaders, handleOptions } from '../_shared/cors';

const verifyPaymentSchema = z.object({
  orderId: z.string(),
  paymentId: z.string(),
  signature: z.string(),
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

    const parsed = verifyPaymentSchema.parse(req.body);

    // Verify signature
    const text = `${parsed.orderId}|${parsed.paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', CONFIG.razorpayKeySecret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== parsed.signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

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
        description: `Payment of ₹${parsed.amount} via Razorpay`,
      },
    });

    return res.json({
      success: true,
      balance: Number(wallet.balance),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Payment verification error:', error);
    return res.status(400).json({ error: error.message || 'Payment verification failed' });
  }
}

