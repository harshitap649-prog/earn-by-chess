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
      // Return empty array instead of error if database fails
      if (error.message?.includes('connect') || error.message?.includes('DATABASE_URL')) {
        return res.json([]);
      }
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

      try {
        const transactions = await prisma.transaction.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        return res.json(transactions);
      } catch (dbError: any) {
        console.warn('Database error in transactions, returning empty array:', dbError.message);
        return res.json([]);
      }
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

      try {
        const userData = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            kycVerified: true,
          },
        });

        if (!userData) {
          // If user not found in DB but JWT is valid, return basic profile
          return res.json({
            user: {
              id: user.id,
              name: 'User',
              email: 'user@example.com',
              kycVerified: false,
              createdAt: new Date().toISOString(),
            },
            wallet: {
              balance: 0,
              lockedBalance: 0,
            },
            stats: {
              totalMatches: 0,
              wins: 0,
              losses: 0,
              draws: 0,
              totalEarnings: 0,
              totalSpent: 0,
              netEarnings: 0,
            },
            recentTransactions: [],
          });
        }

        // Get wallet with fallback
        let wallet;
        try {
          wallet = await getWallet(user.id);
        } catch (walletError: any) {
          console.warn('Wallet fetch failed, using defaults:', walletError.message);
          wallet = { balance: 0, lockedBalance: 0 };
        }

        // Get matches with fallback
        let matchesCreated = [];
        let matchesJoined = [];
        try {
          matchesCreated = await prisma.match.findMany({
            where: {
              creatorId: user.id,
              status: 'completed',
            },
            select: {
              id: true,
              winnerId: true,
            },
          });

          matchesJoined = await prisma.match.findMany({
            where: {
              opponentId: user.id,
              status: 'completed',
            },
            select: {
              id: true,
              winnerId: true,
            },
          });
        } catch (matchError: any) {
          console.warn('Matches fetch failed:', matchError.message);
        }

        const allMatches = [...matchesCreated, ...matchesJoined];
        const wins = allMatches.filter(m => m.winnerId === user.id).length;
        const losses = allMatches.filter(m => m.winnerId && m.winnerId !== user.id).length;
        const draws = allMatches.filter(m => !m.winnerId).length;

        // Get transactions with fallback
        let transactions = [];
        try {
          transactions = await prisma.transaction.findMany({
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
        } catch (txError: any) {
          console.warn('Transactions fetch failed:', txError.message);
        }

        const totalEarnings = transactions
          .filter(t => t.type === 'match_win' || t.type === 'deposit' || t.type === 'DEPOSIT')
          .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
        
        const totalSpent = transactions
          .filter(t => t.type === 'match_loss' || t.type === 'withdraw' || t.type === 'WITHDRAW')
          .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

        return res.json({
          user: {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            kycVerified: userData.kycVerified || false,
            createdAt: userData.createdAt,
          },
          wallet: {
            balance: Number(wallet.balance || 0),
            lockedBalance: Number(wallet.lockedBalance || 0),
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
      } catch (dbError: any) {
        console.error('Database error in profile:', dbError);
        // Return basic profile even if database fails
        return res.json({
          user: {
            id: user.id,
            name: 'User',
            email: 'user@example.com',
            kycVerified: false,
            createdAt: new Date().toISOString(),
          },
          wallet: {
            balance: 0,
            lockedBalance: 0,
          },
          stats: {
            totalMatches: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            totalEarnings: 0,
            totalSpent: 0,
            netEarnings: 0,
          },
          recentTransactions: [],
        });
      }
    } catch (error: any) {
      console.error('Profile error:', error);
      return res.status(500).json({ error: error.message || 'Failed to get profile' });
    }
  }

  return res.status(404).json({ error: 'Route not found' });
}

