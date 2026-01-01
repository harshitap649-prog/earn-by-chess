// Combined auth routes - signup, login, firebase
import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db';
import { CONFIG } from '../config';
import { setCorsHeaders, handleOptions } from './_shared/cors';

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

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

  const path = req.url?.split('?')[0] || '';
  const isSignup = path.includes('/signup') || path.endsWith('/auth/signup');
  const isLogin = path.includes('/login') || path.endsWith('/auth/login');
  const isFirebase = path.includes('/firebase') || path.endsWith('/auth/firebase');

  // Signup
  if (isSignup && req.method === 'POST') {
    try {
      const body = signupSchema.parse(req.body);
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const passwordHash = await bcrypt.hash(body.password, 10);
      const user = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          passwordHash,
        },
      });

      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          lockedBalance: 0,
        },
      });

      return res.status(201).json({
        message: 'User created successfully',
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
      return res.status(500).json({ error: error.message || 'Failed to create user' });
    }
  }

  // Login
  if (isLogin && req.method === 'POST') {
    try {
      const body = loginSchema.parse(req.body);
      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(body.password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
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
      return res.status(500).json({ error: error.message || 'Login failed' });
    }
  }

  // Firebase auth
  if (isFirebase && req.method === 'POST') {
    try {
      const parsed = firebaseAuthSchema.parse(req.body);
      let user = await prisma.user.findUnique({
        where: { id: parsed.firebaseUid },
      });

      if (user) {
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
        const existingUser = await prisma.user.findUnique({
          where: { email: parsed.email },
        });

        if (existingUser) {
          user = existingUser;
        } else {
          user = await prisma.user.create({
            data: {
              id: parsed.firebaseUid,
              name: parsed.name,
              email: parsed.email,
              passwordHash: null,
            },
          });

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
      return res.status(500).json({ error: error.message || 'Firebase auth failed' });
    }
  }

  return res.status(404).json({ error: 'Route not found' });
}

