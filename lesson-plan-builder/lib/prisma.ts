import { PrismaClient } from "./generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

// Validate database URL
if (!connectionString) {
  console.error("❌ DATABASE_URL is not set in environment variables");
  throw new Error("DATABASE_URL environment variable is required");
}

// Create connection pool with better error handling
const pool = new Pool({
  connectionString,
  // Connection timeout settings
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});

const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
  });

  return client;
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export { prisma, pool };

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

// Helper function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
