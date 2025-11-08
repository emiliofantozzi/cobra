import { z } from "zod";

const urlWithDefault = (key: string, fallback: string) =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (!value || value.trim().length === 0) {
        return fallback;
      }

      return value;
    })
    .pipe(z.string().url(`${key} must be a valid URL`));

const requiredString = (key: string) =>
  z.string().min(1, `${key} must be set`);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default(process.env.NODE_ENV ?? "development"),
  NEXT_PUBLIC_APP_URL: urlWithDefault(
    "NEXT_PUBLIC_APP_URL",
    "http://localhost:3000",
  ),
  AUTH_URL: urlWithDefault("AUTH_URL", "http://localhost:3000"),
  AUTH_SECRET: requiredString("AUTH_SECRET"),
  GOOGLE_CLIENT_ID: requiredString("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: requiredString("GOOGLE_CLIENT_SECRET"),
  DATABASE_URL: requiredString("DATABASE_URL"),
  DIRECT_URL: requiredString("DIRECT_URL"),
  SENTRY_DSN: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? undefined : value)),
  SENTRY_ENVIRONMENT: z.string().default("development"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsedEnv.error.flatten().fieldErrors,
  );
  throw new Error(
    "Missing or invalid environment variables. Please review docs/env-vars.md",
  );
}

export const env = parsedEnv.data;

export type AppEnvironment = typeof env;

