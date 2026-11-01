import { vi } from "vitest";

// Unit tests never touch a database. config.ts validates DATABASE_URL at import.
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.NODE_ENV = "test";

vi.mock("../db", () => ({ db: {}, pool: { end: async () => undefined } }));
