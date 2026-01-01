import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Test database connection on startup
async function connectDatabase() {
  try {
    console.log("🔌 Attempting to connect to database...");
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    
    // Test a simple query (SQLite compatible)
    try {
      const count = await prisma.user.count();
      console.log(`✅ Database query test successful (Users in DB: ${count})`);
    } catch (queryError: any) {
      console.error("❌ Database query test failed:", queryError.message);
      throw queryError;
    }
  } catch (error: any) {
    console.error("❌ Database connection failed:", error.message);
    console.error("Error details:", error);
    console.error("Please check your database configuration");
    console.error("Make sure the database file exists at: prisma/dev.db");
  }
}

// Connect database asynchronously (don't block server startup)
connectDatabase().catch((error) => {
  console.error("Fatal database connection error:", error);
});

