// lib/db.ts — Neon Postgres client
import { neon } from "@neondatabase/serverless";

// Returns a SQL query function connected to Neon
// Usage: const rows = await sql`SELECT * FROM grants`;
export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(databaseUrl);
}

// Helper: check if database is configured
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}
