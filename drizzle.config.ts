import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/loadm" },
  schemaFilter: ["showcase"],
  strict: true,
  verbose: true,
});
