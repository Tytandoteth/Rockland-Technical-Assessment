import { neon } from "@neondatabase/serverless";

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(databaseUrl);
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
