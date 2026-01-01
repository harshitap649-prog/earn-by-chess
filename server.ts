// Load environment variables manually
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envPath = join(process.cwd(), '.env');
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
  console.log('✅ Environment variables loaded from .env file');
} catch (error) {
  console.log('⚠️  .env file not found, using default values');
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
let Razorpay: any = null;
try {
  Razorpay = require("razorpay");
} catch (error) {
  console.log("⚠️  Razorpay package not found. Installing...");
  console.log("Run: npm install razorpay");
}
import crypto from "crypto";
import { prisma } from "./db";
import { CONFIG } from "./config";
import { authMiddleware, AuthedRequest } from "./middleware/auth";
import { stateBlockMiddleware } from "./middleware/stateBlock";
import { createMatch, joinMatch, completeMatch } from "./services/match";
import { getWallet } from "./services/wallet";
import { initGameSocket } from "./sockets/gameSocket";

// Initialize Razorpay (only if keys are provided and package is installed)
let razorpay: any = null;
if (Razorpay && CONFIG.razorpayKeyId && CONFIG.razorpayKeySecret && CONFIG.razorpayKeyId !== "" && CONFIG.razorpayKeySecret !== "") {
  try {
    razorpay = new Razorpay({
      key_id: CONFIG.razorpayKeyId,
      key_secret: CONFIG.razorpayKeySecret,
    });
    console.log("✅ Razorpay payment gateway initialized successfully");
  } catch (error) {
    console.log("⚠️  Failed to initialize Razorpay:", error);
  }
} else if (!Razorpay) {
  console.log("⚠️  Razorpay package not installed. Run: npm install razorpay");
} else {
  console.log("⚠️  Razorpay keys not found. Payment gateway disabled. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file");
}

// Make io available for routes
let ioInstance: Server;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: CONFIG.corsOrigin } });
ioInstance = io;

initGameSocket(io);

app.use(express.json());
app.use(cors({ origin: CONFIG.corsOrigin }));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:3000", "ws://localhost:3000"],
    },
  },
}));
app.use(stateBlockMiddleware);

app.get("/", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Chess Earning Site - Backend API</title>
      <meta http-equiv="refresh" content="2;url=http://localhost:5173">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          text-align: center;
        }
        h1 {
          color: #667eea;
          margin-bottom: 10px;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .link {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
        }
        .link:hover {
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎮 Chess Earning Site</h1>
        <p>Redirecting to frontend application...</p>
        <div class="spinner"></div>
        <p>If you're not redirected automatically, click below:</p>
        <a href="http://localhost:5173" class="link">🚀 Open Application</a>
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          Backend API is running on port 3000<br>
          Frontend should be on port 5173
        </p>
      </div>
    </body>
    </html>
  `);
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// Simple test endpoint (no auth required)
app.get("/test", (_req, res) => {
  res.json({ 
    message: "Server is running",
    timestamp: new Date().toISOString(),
    database: "connected"
  });
});

// Handle favicon requests
app.get("/favicon.ico", (_req, res) => res.status(204).end());

// Auth Routes
app.post("/auth/signup", async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
    });

    const parsed = schema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });

    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);
    const user = await prisma.user.create({
      data: { name: parsed.name, email: parsed.email, passwordHash },
    });

    const token = jwt.sign({ userId: user.id }, CONFIG.jwtSecret, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Signup failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const parsed = schema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: parsed.email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, CONFIG.jwtSecret, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Login failed" });
  }
});

// Firebase Auth Route - Sync Firebase user with backend
app.post("/auth/firebase", async (req, res) => {
  try {
    const schema = z.object({
      firebaseUid: z.string(),
      email: z.string().email(),
      name: z.string().min(2),
      idToken: z.string().optional(),
    });

    const parsed = schema.parse(req.body);
    
    // Check if user exists by Firebase UID first
    let user = await prisma.user.findUnique({
      where: { id: parsed.firebaseUid }
    });

    if (user) {
      // User exists with this Firebase UID, update if needed
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
        where: { email: parsed.email }
      });

      if (existingUser) {
        // User exists with different ID - use existing user
        // (In production, you might want to merge accounts or handle this differently)
        user = existingUser;
      } else {
        // Create new user with Firebase UID as ID
        // Try creating user - handle both migrated and non-migrated databases
        try {
          // First try with null passwordHash (for migrated databases)
          user = await prisma.user.create({
            data: {
              id: parsed.firebaseUid,
              name: parsed.name,
              email: parsed.email,
              passwordHash: null,
            },
          });
        } catch (createError: any) {
          // If unique constraint error, user might already exist
          if (createError.code === 'P2002') {
            // Try to find the user
            user = await prisma.user.findUnique({
              where: { id: parsed.firebaseUid }
            }) || await prisma.user.findUnique({
              where: { email: parsed.email }
            });
            
            if (!user) {
              // If still not found, try with empty string (for non-migrated databases)
              try {
                user = await prisma.user.create({
                  data: {
                    id: parsed.firebaseUid,
                    name: parsed.name,
                    email: parsed.email,
                    passwordHash: '',
                  },
                });
              } catch (secondError: any) {
                console.error('Error creating Firebase user (second attempt):', secondError);
                // Last resort: try to find user again
                user = await prisma.user.findUnique({
                  where: { email: parsed.email }
                });
                if (!user) {
                  throw new Error(`Failed to create user: ${secondError.message || createError.message}`);
                }
              }
            }
          } else if (createError.message?.includes('passwordHash') || createError.message?.includes('required')) {
            // Database hasn't been migrated - try with empty string
            try {
              user = await prisma.user.create({
                data: {
                  id: parsed.firebaseUid,
                  name: parsed.name,
                  email: parsed.email,
                  passwordHash: '',
                },
              });
            } catch (secondError: any) {
              console.error('Error creating Firebase user:', secondError);
              throw new Error(`Database error: Please run 'npx prisma db push' to update the database schema. Error: ${secondError.message}`);
            }
          } else {
            console.error('Error creating Firebase user:', createError);
            throw createError;
          }
        }
      }
    }

    if (!user) {
      return res.status(500).json({ error: "Failed to create or retrieve user" });
    }

    // Ensure wallet exists for the user
    try {
      await prisma.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          balance: 0,
          lockedBalance: 0,
        },
      });
    } catch (walletError) {
      console.error("Wallet creation error (non-critical):", walletError);
      // Continue even if wallet creation fails
    }

    // Generate JWT token for backend API
    const token = jwt.sign({ userId: user.id }, CONFIG.jwtSecret, { expiresIn: "7d" });
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name } 
    });
  } catch (error: any) {
    console.error('Firebase auth error:', error);
    const errorMessage = error.message || "Firebase auth failed";
    res.status(500).json({ 
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.stack,
        code: error.code 
      })
    });
  }
});

// Wallet Routes
app.get("/wallet", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    console.log("=== WALLET REQUEST START ===");
    console.log("User ID:", req.user?.id);
    
    if (!req.user?.id) {
      console.error("ERROR: User not authenticated");
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    console.log("Getting wallet for user:", req.user.id);
    try {
      const wallet = await getWallet(req.user.id);
      console.log("Wallet retrieved:", {
        id: wallet.id,
        balance: wallet.balance.toString(),
        lockedBalance: wallet.lockedBalance.toString()
      });
      console.log("=== WALLET REQUEST END ===");
      
      res.json({
        balance: Number(wallet.balance),
        lockedBalance: Number(wallet.lockedBalance),
      });
    } catch (dbError: any) {
      console.error("=== DATABASE ERROR ===");
      console.error("Error message:", dbError.message);
      console.error("Error name:", dbError.name);
      console.error("Error stack:", dbError.stack);
      console.error("=== END ERROR ===");
      
      res.status(500).json({ 
        error: "Database error: " + (dbError.message || "Failed to get wallet"),
        details: dbError.stack
      });
    }
  } catch (error: any) {
    console.error("=== WALLET ENDPOINT ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    console.error("Error stack:", error.stack);
    console.error("=== END ERROR ===");
    
    res.status(500).json({ 
      error: error.message || "Failed to get wallet",
      details: error.stack
    });
  }
});

// Create Razorpay order for payment
app.post("/payment/create-order", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ error: "Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables." });
    }

    const schema = z.object({ amount: z.number().positive().min(1) });
    const parsed = schema.parse(req.body);
    
    const amountInPaise = Math.round(parsed.amount * 100); // Convert to paise
    
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${req.user!.id}_${Date.now()}`,
      notes: {
        userId: req.user!.id,
      },
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      orderId: order.id,
      amount: parsed.amount,
      keyId: CONFIG.razorpayKeyId || "",
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    res.status(400).json({ error: error.message || "Failed to create payment order" });
  }
});

// Verify payment and update wallet
app.post("/payment/verify", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const schema = z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
      amount: z.number().positive(),
    });
    const parsed = schema.parse(req.body);

    // Verify payment signature
    const text = `${parsed.razorpay_order_id}|${parsed.razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", CONFIG.razorpayKeySecret)
      .update(text)
      .digest("hex");

    if (generatedSignature !== parsed.razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Update wallet
    await prisma.wallet.update({
      where: { userId: req.user!.id },
      data: { balance: { increment: parsed.amount } },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: req.user!.id,
        amount: parsed.amount,
        type: "deposit",
        description: `Payment via Razorpay - Order: ${parsed.razorpay_order_id}`,
      },
    });

    const updatedWallet = await getWallet(req.user!.id);
    res.json({
      success: true,
      message: "Payment successful",
      balance: Number(updatedWallet.balance),
      lockedBalance: Number(updatedWallet.lockedBalance),
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    res.status(400).json({ error: error.message || "Payment verification failed" });
  }
});

// Legacy deposit endpoint (for testing - can be removed in production)
app.post("/wallet/deposit", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    console.log("Deposit request received:", { userId: req.user?.id, body: req.body });
    
    const schema = z.object({ amount: z.number().positive() });
    const parsed = schema.parse(req.body);
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const wallet = await getWallet(req.user.id);
    console.log("Wallet found:", { balance: wallet.balance, lockedBalance: wallet.lockedBalance });
    
    await prisma.wallet.update({
      where: { userId: req.user.id },
      data: { balance: { increment: parsed.amount } },
    });

    await prisma.transaction.create({
      data: {
        userId: req.user.id,
        amount: parsed.amount,
        type: "deposit",
        description: `Deposit of ₹${parsed.amount} (Testing)`,
      },
    });

    const updatedWallet = await getWallet(req.user.id);
    console.log("Deposit successful:", { newBalance: updatedWallet.balance });
    
    res.json({
      success: true,
      balance: Number(updatedWallet.balance),
      lockedBalance: Number(updatedWallet.lockedBalance),
    });
  } catch (error: any) {
    console.error("=== DEPOSIT ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    console.error("Error stack:", error.stack);
    console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("=== END ERROR ===");
    
    res.status(500).json({ 
      error: error.message || "Deposit failed. Please try again.",
      details: error.stack
    });
  }
});

app.get("/transactions", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Match Routes
app.post("/match/create", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    console.log("=== MATCH CREATE REQUEST ===");
    console.log("User ID:", req.user?.id);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    // Allow entryFee to be 0 (free play) or positive number
    const schema = z.object({ entryFee: z.number().min(0).optional() });
    let parsed;
    try {
      parsed = schema.parse(req.body);
    } catch (validationError: any) {
      console.error("Validation error:", validationError);
      return res.status(400).json({ error: "Invalid entry fee. Must be 0 or greater." });
    }
    
    // Handle entryFee: 0 is valid for free play, undefined defaults to 10
    const entryFee = parsed.entryFee !== undefined ? parsed.entryFee : 10;
    
    console.log("Entry fee:", entryFee, "Type:", typeof entryFee);
    console.log("Creating match...");
    
    const match = await createMatch(req.user.id, entryFee);
    
    console.log("Match created successfully:", match.id);
    console.log("=== MATCH CREATE END ===");
    
    res.json(match);
  } catch (error: any) {
    console.error("=== MATCH CREATE ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    console.error("Error stack:", error.stack);
    console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("=== END ERROR ===");
    res.status(500).json({ error: error.message || "Failed to create match" });
  }
});

app.post("/match/join/:id", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const match = await joinMatch(req.params.id, req.user!.id);
    res.json(match);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/matches", async (_req, res) => {
  try {
    console.log("=== MATCHES REQUEST START ===");
    
    // Get matches without relations first to avoid potential issues
    const matches = await prisma.match.findMany({
      where: { status: "waiting" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    
    // Get creator info separately to avoid relation errors
    const matchesWithCreators = await Promise.all(
      matches.map(async (match) => {
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
          console.error(`Error fetching creator for match ${match.id}:`, err);
          return {
            ...match,
            creator: null,
          };
        }
      })
    );
    
    console.log(`Found ${matchesWithCreators.length} waiting matches`);
    console.log("=== MATCHES REQUEST END ===");
    res.json(matchesWithCreators);
  } catch (error: any) {
    console.error("=== MATCHES ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    console.error("Error stack:", error.stack);
    console.error("=== END ERROR ===");
    res.status(500).json({ 
      error: error.message || "Failed to get matches",
      details: error.stack
    });
  }
});

app.get("/match/:id", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    // Get match first without relations to avoid errors
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
    });
    
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }
    
    // Get creator and opponent separately to handle errors gracefully
    let creator = null;
    let opponent = null;
    
    try {
      creator = await prisma.user.findUnique({
        where: { id: match.creatorId },
        select: { id: true, name: true, email: true },
      });
    } catch (err) {
      console.error(`Error fetching creator for match ${match.id}:`, err);
    }
    
    if (match.opponentId) {
      try {
        opponent = await prisma.user.findUnique({
          where: { id: match.opponentId },
          select: { id: true, name: true, email: true },
        });
        
        // If opponent is computer, set a default name
        if (!opponent && match.opponentId) {
          opponent = {
            id: match.opponentId,
            name: '🤖 Chess AI',
            email: 'computer@chess-ai.local',
          };
        }
      } catch (err) {
        console.error(`Error fetching opponent for match ${match.id}:`, err);
        // If opponent is computer and not found, create a default object
        if (match.opponentId) {
          opponent = {
            id: match.opponentId,
            name: '🤖 Chess AI',
            email: 'computer@chess-ai.local',
          };
        }
      }
    }
    
    res.json({
      ...match,
      creator: creator || null,
      opponent: opponent || null,
    });
  } catch (error: any) {
    console.error("❌ Error in /match/:id endpoint:", error);
    console.error("   Error message:", error?.message);
    console.error("   Error stack:", error?.stack);
    console.error("   Match ID requested:", req.params.id);
    console.error("   User ID:", req.user?.id);
    res.status(500).json({ 
      error: error.message || "Failed to get match",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post("/match/complete/:id", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const schema = z.object({ 
      winnerId: z.string().optional(),
      isDraw: z.boolean().optional()
    });
    const parsed = schema.parse(req.body);
    
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (match.creatorId !== req.user!.id && match.opponentId !== req.user!.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (!match.opponentId) {
      return res.status(400).json({ error: "Match not fully joined" });
    }

    let completedMatch;
    
    if (parsed.isDraw) {
      // Handle draw - refund both players
      const entryFee = Number(match.entryFee);
      
      await prisma.wallet.update({
        where: { userId: match.creatorId },
        data: {
          lockedBalance: { decrement: entryFee },
          balance: { increment: entryFee },
        },
      });

      await prisma.wallet.update({
        where: { userId: match.opponentId },
        data: {
          lockedBalance: { decrement: entryFee },
          balance: { increment: entryFee },
        },
      });

      completedMatch = await prisma.match.update({
        where: { id: req.params.id },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      });

      ioInstance.to(`match-${req.params.id}`).emit("match-completed", {
        isDraw: true,
        match: completedMatch,
      });
    } else {
      if (!parsed.winnerId) {
        return res.status(400).json({ error: "winnerId required for non-draw matches" });
      }

      const loserId = match.creatorId === parsed.winnerId ? match.opponentId : match.creatorId;
      completedMatch = await completeMatch(req.params.id, parsed.winnerId, loserId);
      
      // Emit match completion event
      ioInstance.to(`match-${req.params.id}`).emit("match-completed", {
        winnerId: parsed.winnerId,
        match: completedMatch,
      });
    }

    res.json(completedMatch);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Profile Routes
app.get("/profile", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    console.log("=== PROFILE REQUEST START ===");
    console.log("User ID:", req.user?.id);
    
    if (!req.user?.id) {
      console.error("ERROR: User not authenticated");
      return res.status(401).json({ error: "User not authenticated" });
    }

    const userId = req.user.id;

    // Get user with minimal data first
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        kycVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.error("ERROR: User not found");
      return res.status(404).json({ error: "User not found" });
    }

    // Get wallet - ensure it exists
    let wallet;
    try {
      wallet = await getWallet(userId);
    } catch (walletError: any) {
      console.error("Error getting wallet:", walletError);
      // Create default wallet if it doesn't exist
      try {
        wallet = await prisma.wallet.create({
          data: {
            userId: userId,
            balance: 0,
            lockedBalance: 0,
          },
        });
      } catch (createError: any) {
        console.error("Error creating wallet:", createError);
        wallet = { balance: 0, lockedBalance: 0 } as any;
      }
    }

    // Get matches separately to avoid relation issues
    const matchesCreated = await prisma.match.findMany({
      where: {
        creatorId: userId,
        status: "completed",
      },
      select: {
        id: true,
        winnerId: true,
      },
    });

    const matchesJoined = await prisma.match.findMany({
      where: {
        opponentId: userId,
        status: "completed",
      },
      select: {
        id: true,
        winnerId: true,
      },
    });

    const allMatches = [...matchesCreated, ...matchesJoined];
    const wins = allMatches.filter(m => m.winnerId === userId).length;
    const losses = allMatches.filter(m => m.winnerId && m.winnerId !== userId).length;
    const draws = allMatches.filter(m => !m.winnerId).length;

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
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
      .filter(t => t.type === "match_win" || t.type === "deposit")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    
    const totalSpent = transactions
      .filter(t => t.type === "match_loss" || t.type === "withdraw")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const profileData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        kycVerified: user.kycVerified,
        createdAt: user.createdAt,
      },
      wallet: {
        balance: Number(wallet?.balance || 0),
        lockedBalance: Number(wallet?.lockedBalance || 0),
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
    };

    console.log("Profile data retrieved successfully");
    console.log("=== PROFILE REQUEST END ===");
    
    res.json(profileData);
  } catch (error: any) {
    console.error("=== PROFILE ENDPOINT ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    console.error("Error stack:", error.stack);
    console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("=== END ERROR ===");
    
    res.status(500).json({ 
      error: error.message || "Failed to get profile",
      ...(process.env.NODE_ENV === 'development' && { details: error.stack })
    });
  }
});

// Withdraw Routes
app.post("/withdraw", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const schema = z.object({ amount: z.number().min(CONFIG.minWithdraw) });
    const parsed = schema.parse(req.body);

    const wallet = await getWallet(req.user!.id);
    if (Number(wallet.balance) < parsed.amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Check if user already has pending withdrawal today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await prisma.withdrawRequest.findFirst({
      where: {
        userId: req.user!.id,
        status: "pending",
        requestedAt: { gte: today },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "One withdrawal per day allowed" });
    }

    // Lock the amount
    await prisma.wallet.update({
      where: { userId: req.user!.id },
      data: {
        balance: { decrement: parsed.amount },
        lockedBalance: { increment: parsed.amount },
      },
    });

    const request = await prisma.withdrawRequest.create({
      data: {
        userId: req.user!.id,
        amount: parsed.amount,
        status: "pending",
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: req.user!.id,
        amount: parsed.amount,
        type: "withdraw",
        description: `Withdrawal request of ₹${parsed.amount}`,
      },
    });

    res.json(request);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/withdraw/requests", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const requests = await prisma.withdrawRequest.findMany({
      where: { userId: req.user!.id },
      orderBy: { requestedAt: "desc" },
      take: 20,
    });
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check match status
app.get("/debug/match/:matchId", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.matchId },
    });
    
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }
    
    // Check computer player availability
    let Chess: any = null;
    let getComputerMove: any = null;
    try {
      const chessModule = require("chess.js");
      Chess = chessModule.Chess;
      const computerPlayer = require("./services/computerPlayer");
      getComputerMove = computerPlayer.getComputerMove;
    } catch (error) {
      // Ignore
    }
    
    res.json({
      match: {
        id: match.id,
        entryFee: match.entryFee.toString(),
        opponentId: match.opponentId,
        creatorId: match.creatorId,
        status: match.status,
      },
      isFreeMatch: Number(match.entryFee) === 0,
      hasComputerOpponent: Number(match.entryFee) === 0 && !!match.opponentId,
      computerAvailable: !!(Chess && getComputerMove),
      chessLoaded: !!Chess,
      computerMoveFunctionLoaded: !!getComputerMove,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = CONFIG.port;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`💳 Payment Gateway: ${razorpay ? '✅ Razorpay Enabled' : '❌ Not Configured'}`);
});

