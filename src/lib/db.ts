import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across Next.js dev-mode HMR reloads.
// Without this, every code change would spawn a new client and exhaust the
// underlying DB connection pool within minutes.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
