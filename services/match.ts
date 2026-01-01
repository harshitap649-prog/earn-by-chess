import { prisma } from "../db";
import { getWallet } from "./wallet";

// Import computer player - ensure it's always available for free matches
let getComputerUserId: any = null;
try {
  const computerPlayer = require("./computerPlayer");
  getComputerUserId = computerPlayer.getComputerUserId;
  if (getComputerUserId && typeof getComputerUserId === 'function') {
    console.log("✅ Computer player module loaded successfully");
  } else {
    console.error("❌ getComputerUserId is not a function:", typeof getComputerUserId);
  }
} catch (error: any) {
  console.error("❌ Failed to load computer player module:", error?.message || error);
  console.error("   Error details:", error);
  // We'll handle this gracefully in createMatch
}

export async function createMatch(userId: string, entryFee: number) {
  console.log("createMatch called:", { userId, entryFee });
  
  // For free matches (entryFee = 0), skip wallet check entirely
  if (entryFee > 0) {
    const wallet = await getWallet(userId);
    console.log("Wallet retrieved:", { balance: wallet.balance.toString(), lockedBalance: wallet.lockedBalance.toString() });
    
    if (Number(wallet.balance) < entryFee) {
      throw new Error("Insufficient balance");
    }

    console.log("Locking entry fee:", entryFee);
    // Lock the entry fee
    await prisma.wallet.update({
      where: { userId },
      data: {
        balance: { decrement: entryFee },
        lockedBalance: { increment: entryFee },
      },
    });
    console.log("Entry fee locked successfully");
  } else {
    console.log("Free match - skipping wallet operations entirely");
  }

  console.log("Creating match in database...");
  console.log("Entry fee value:", entryFee, "Type:", typeof entryFee);
  
  // For free matches (entryFee = 0), automatically assign computer opponent if available
  // Otherwise, create match in practice mode (user can play alone)
  let matchData: any = {
    creatorId: userId,
    entryFee: entryFee.toString(), // Convert to string for Prisma Decimal type
    status: entryFee === 0 ? "started" : "waiting", // Start immediately for free matches
  };
  
  if (entryFee === 0) {
    // Always set startedAt for free matches
    matchData.startedAt = new Date();
    
    // Always try to assign computer opponent for free matches
    if (getComputerUserId) {
      try {
        const computerUserId = await getComputerUserId(prisma);
        matchData.opponentId = computerUserId;
        console.log("✅ Free match - assigned computer opponent:", computerUserId);
      } catch (error: any) {
        console.error("❌ Error assigning computer opponent:", error?.message || error);
        // If computer assignment fails, still create match but log the error
        // The match will work in practice mode (user plays alone)
        console.log("⚠️  Free match created without computer opponent - practice mode only");
      }
    } else {
      console.error("❌ Computer player module not available - cannot assign computer opponent");
      console.log("⚠️  Free match created without computer opponent - practice mode only");
    }
  }
  
  // Create the match
  try {
    const match = await prisma.match.create({
      data: matchData,
    });
    
    console.log("Match created successfully:", { id: match.id, entryFee: match.entryFee.toString(), status: match.status });
    return match;
  } catch (createError: any) {
    console.error("Error creating match:", createError);
    throw new Error(`Failed to create match: ${createError.message || 'Unknown error'}`);
  }
}

export async function joinMatch(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    throw new Error("Match not found");
  }

  if (match.status !== "waiting") {
    throw new Error("Match is not available");
  }

  if (match.creatorId === userId) {
    throw new Error("Cannot join your own match");
  }

  const wallet = await getWallet(userId);
  const entryFee = Number(match.entryFee);

  // For free matches (entryFee = 0), skip balance check and wallet update
  if (entryFee > 0) {
    if (Number(wallet.balance) < entryFee) {
      throw new Error("Insufficient balance");
    }

    // Lock the entry fee
    await prisma.wallet.update({
      where: { userId },
      data: {
        balance: { decrement: entryFee },
        lockedBalance: { increment: entryFee },
      },
    });
  }

  // Update match to started
  const updatedMatch = await prisma.match.update({
    where: { id: matchId },
    data: {
      opponentId: userId,
      status: "started",
      startedAt: new Date(),
    },
  });

  return updatedMatch;
}

// Calculate prize based on entry fee
export function calculatePrize(entryFee: number): { winnerPrize: number; platformProfit: number; totalPool: number } {
  const totalPool = entryFee * 2;
  let winnerPrize: number;
  let platformProfit: number;

  if (entryFee === 2) {
    // ₹2 entry: Winner gets ₹3, profit ₹1
    winnerPrize = 3;
    platformProfit = 1;
  } else if (entryFee === 4) {
    // ₹4 entry: Winner gets ₹7, profit ₹1
    winnerPrize = 7;
    platformProfit = 1;
  } else if (entryFee === 10) {
    // ₹10 entry: Winner gets ₹18, profit ₹2
    winnerPrize = 18;
    platformProfit = 2;
  } else {
    // Default: 10% platform fee
    platformProfit = Math.round(totalPool * 0.1);
    winnerPrize = totalPool - platformProfit;
  }

  return { winnerPrize, platformProfit, totalPool };
}

export async function completeMatch(
  matchId: string,
  winnerId: string,
  loserId: string
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match || match.status !== "started") {
    throw new Error("Match not found or not started");
  }

  const entryFee = Number(match.entryFee);
  const { winnerPrize, platformProfit } = calculatePrize(entryFee);

  // For free matches (entryFee = 0), skip wallet updates and transactions
  if (entryFee > 0) {
    // Unlock winner's entry fee and add prize
    await prisma.wallet.update({
      where: { userId: winnerId },
      data: {
        lockedBalance: { decrement: entryFee },
        balance: { increment: winnerPrize },
      },
    });

    // Unlock loser's locked balance (they lose their entry fee)
    await prisma.wallet.update({
      where: { userId: loserId },
      data: {
        lockedBalance: { decrement: entryFee },
      },
    });

    // Create transaction records
    await prisma.transaction.create({
      data: {
        userId: winnerId,
        amount: winnerPrize,
        type: "match_win",
        description: `Won chess match ${matchId} - Prize: ₹${winnerPrize}`,
      },
    });

    await prisma.transaction.create({
      data: {
        userId: loserId,
        amount: -entryFee,
        type: "match_loss",
        description: `Lost chess match ${matchId} - Entry fee: ₹${entryFee}`,
      },
    });
  }

  const completedMatch = await prisma.match.update({
    where: { id: matchId },
    data: {
      status: "completed",
      winnerId,
      completedAt: new Date(),
    },
  });

  return completedMatch;
}

