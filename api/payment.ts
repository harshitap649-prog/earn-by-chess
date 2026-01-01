// Combined payment routes - create order, verify
import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../db';
import { CONFIG } from '../config';
import { verifyAuth, sendUnauthorized } from './_shared/auth';
import { setCorsHeaders, handleOptions } from './_shared/cors';

let Razorpay: any = null;
try {
  Razorpay = require('razorpay');
} catch (error) {
  console.log('⚠️  Razorpay package not found');
}

let razorpay: any = null;
if (Razorpay && CONFIG.razorpayKeyId && CONFIG.razorpayKeySecret) {
  try {
    razorpay = new Razorpay({
      key_id: CONFIG.razorpayKeyId,
      key_secret: CONFIG.razorpayKeySecret,
    });
  } catch (error) {
    console.log('⚠️  Failed to initialize Razorpay');
  }
}

const createOrderSchema = z.object({
  amount: z.number().positive().min(1),
});

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

  const path = req.url?.split('?')[0] || '';
  const isCreateOrder = path.includes('/create-order') || path.endsWith('/payment/create-order');
  const isVerify = path.includes('/verify') || path.endsWith('/payment/verify');
  const user = await verifyAuth(req);
  
  if (!user) {
    return sendUnauthorized(res);
  }

  // Create order
  if (isCreateOrder && req.method === 'POST') {
    try {
      if (!razorpay) {
        return res.status(503).json({
          error: 'Payment gateway not configured',
        });
      }

      const parsed = createOrderSchema.parse(req.body);
      const amountInPaise = Math.round(parsed.amount * 100);

      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${user.id}_${Date.now()}`,
        notes: {
          userId: user.id,
        },
      };

      const order = await razorpay.orders.create(options);

      return res.json({
        orderId: order.id,
        amount: parsed.amount,
        keyId: CONFIG.razorpayKeyId || '',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      return res.status(400).json({ error: error.message || 'Failed to create payment order' });
    }
  }

  // Verify payment
  if (isVerify && req.method === 'POST') {
    try {
      const parsed = verifyPaymentSchema.parse(req.body);

      const text = `${parsed.orderId}|${parsed.paymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', CONFIG.razorpayKeySecret)
        .update(text)
        .digest('hex');

      if (generatedSignature !== parsed.signature) {
        return res.status(400).json({ error: 'Invalid payment signature' });
      }

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
      return res.status(400).json({ error: error.message || 'Payment verification failed' });
    }
  }

  return res.status(404).json({ error: 'Route not found' });
}

