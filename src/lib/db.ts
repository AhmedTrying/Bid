// Prisma client singleton + database-availability guard.
//
// The app is deploy-safe: when no Postgres DATABASE_URL is configured it falls
// back to the in-memory seed data (src/lib/data.ts) so it still runs on Vercel
// with zero database. The moment a Neon (or any Postgres) URL is present, the
// API routes switch to reading/writing the real database.

import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL ?? ''

/** True only when a real Postgres connection string is configured. */
export const dbEnabled = url.startsWith('postgres')

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma: PrismaClient | null = dbEnabled
  ? (globalForPrisma.prisma ?? new PrismaClient())
  : null

if (dbEnabled && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma!
}
