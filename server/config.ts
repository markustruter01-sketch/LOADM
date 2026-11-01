import { z } from "zod";

/**
 * Validated environment. The process refuses to start if anything required
 * is missing or malformed, so misconfiguration fails loudly at boot rather
 * than as a 500 on the first request.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  DATABASE_URL: z.string().url(),
  /** Set to "false" to skip seeding on boot when the database is empty. */
  SEED_ON_BOOT: z
    .string()
    .default("true")
    .transform((v) => v !== "false"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "silent"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

function load(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    // eslint-disable-next-line no-console
    console.error(`Invalid environment:\n${issues}`);
    process.exit(1);
  }
  return parsed.data;
}

export const env = load();
export const isProd = env.NODE_ENV === "production";
