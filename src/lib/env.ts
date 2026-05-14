import { z } from "zod";

// Runtime env validation skeleton.
// DATA-001 keeps only the placeholders required for downstream tasks.
// Real secrets are injected via Vercel / Supabase and never committed.
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

// Lazy parse so build-time scaffolding does not fail on missing optional vars.
// Downstream tasks (NFR-002) will tighten required fields.
export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(process.env);
}

export function getClientEnv(): ClientEnv {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}
