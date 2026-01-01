// Combined data routes - matches, transactions, profile
import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../db';
import { getWallet } from '../services/wallet';
import { verifyAuth, sendUnauthorized } from './_shared/auth';
import { setCorsHeaders, handleOptions } from './_shared/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  const path = req.url?.split('?')[0] || '';
  const isMatches = path.includes('/matches') || path.endsWith('/matches') || path.endsWith('/data/matches');
  const isTransactions = path.includes('/transactions') || path.endsWith('/transactions') || path.endsWith('/data/transactions');
  const isProfile = path.includes('/profile') || path.endsWith('/profile') || path.endsWith('/data/profile');

  // Matches (public, no auth needed)
  if (isMatches && req.method === 'GET') {
    try {
      const matches = await prisma.match.findMany({
        where: {
          status: 'waiting',
          opponentId: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      });

      const matchesWithCreators = await Promise.all(
        matches.map(async (match: any) => {
          try {
            const creator = await prisma.user.findUnique({
              where: { id: match.creatorId },
              select: {
                id: true,
                name: true,
                email: true,
              },
            });
            return {
              ...match,
              creator: creator || null,
            };
          } catch (err) {
            return {
              ...match,
              creator: null,
            };
          }
        })
      );

      return res.json(matchesWithCreators);
    } catch (error: any) {
      console.error('Matches error:', error);
      return res.status(500).json({ error: error.message || 'Failed to get matches' });
    }
  }

  // Transactions (requires auth)
  if (isTransactions && req.method === 'GET') {
    try {
      const user = await verifyAuth(req);
      if (!user) {
        return sendUnauthorized(res);
      }

      const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return res.json(transactions);
    } catch (error: any) {
      console.error('Transactions error:', error);
      return res.status(500).json({ error: error.message || 'Failed to get transactions' });
    }
  }

  // Profile (requires auth)
  if (isProfile && req.method === 'GET') {
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

      // Get wallet
      const wallet = await getWallet(user.id);

      // Get matches
      const matchesCreated = await prisma.match.findMany({
        where: {
          creatorId: user.id,
          status: 'completed',
        },
        select: {
          id: true,
          winnerId: true,
        },
      });

      const matchesJoined = await prisma.match.findMany({
        where: {
          opponentId: user.id,
          status: 'completed',
        },
        select: {
          id: true,
          winnerId: true,
        },
      });

      const allMatches = [...matchesCreated, ...matchesJoined];
      const wins = allMatches.filter(m => m.winnerId === user.id).length;
      const losses = allMatches.filter(m => m.winnerId && m.winnerId !== user.id).length;
      const draws = allMatches.filter(m => !m.winnerId).length;

      // Get transactions
      const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          createdAt: true,
        },
      });

      const totalEarnings = transactions
        .filter(t => t.type === 'match_win' || t.type === 'deposit')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      
      const totalSpent = transactions
        .filter(t => t.type === 'match_loss' || t.type === 'withdraw')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

      return res.json({
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          createdAt: userData.createdAt,
        },
        wallet: {
          balance: Number(wallet.balance),
          lockedBalance: Number(wallet.lockedBalance),
        },
        stats: {
          totalMatches: allMatches.length,
          wins,
          losses,
          draws,
          totalEarnings,
          totalSpent,
          netEarnings: totalEarnings - totalSpent,
        },
        recentTransactions: transactions.map(t => ({
          id: t.id,
          amount: Number(t.amount),
          type: t.type,
          description: t.description || null,
          createdAt: t.createdAt,
        })),
      });
    } catch (error: any) {
      console.error('Profile error:', error);
      return res.status(500).json({ error: error.message || 'Failed to get profile' });
    }
  }

  return res.status(404).json({ error: 'Route not found' });
}

