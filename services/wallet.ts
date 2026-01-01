import { prisma } from "../db";

export async function getWallet(userId: string) {
  try {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      // Create wallet with Decimal values as strings
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: "0",
          lockedBalance: "0",
        },
      });
      console.log("Created new wallet for user:", userId);
    }

    return wallet;
  } catch (error: any) {
    console.error("getWallet error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    throw new Error(`Failed to get wallet: ${error.message || 'Unknown error'}`);
  }
}

