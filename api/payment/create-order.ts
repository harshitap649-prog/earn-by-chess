import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { CONFIG } from '../../config';
import { verifyAuth, sendUnauthorized } from '../_shared/auth';
import { setCorsHeaders, handleOptions } from '../_shared/cors';

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
    console.error('Razorpay order creation error:', error);
    return res.status(400).json({ error: error.message || 'Failed to create payment order' });
  }
}

