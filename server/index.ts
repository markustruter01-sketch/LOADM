import { createServer } from "node:http";
import { env, isProd } from "./config";
import { logger } from "./lib/logger";
import { createApp, markReady } from "./app";
import { pool } from "./db";
import { setupVite, serveStatic } from "./vite";
import { attachChatServer } from "./ws/chat";
import { ensureSeeded } from "./services/demo-service";
import { ensureDatabaseSchema } from "./db-setup";
import { errorHandler } from "./middleware/errors";

async function main(): Promise<void> {
  const app = createApp();
  const httpServer = createServer(app);

  // SPA: dev through Vite middleware, prod from dist/public. Mounted after
  // the API so unknown /api/* paths get a JSON 404, not index.html.
  if (isProd) {
    serveStatic(app);
  } else {
    await setupVite(app, httpServer);
  }
  app.use(errorHandler);

  await new Promise<void>((resolve) => httpServer.listen(env.PORT, "0.0.0.0", resolve));
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "LOADM showcase listening");

  await ensureDatabaseSchema();
  await ensureSeeded();
  attachChatServer(httpServer);
  markReady();
  logger.info("ready");

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "shutting down");
    httpServer.close();
    await pool.end().catch(() => undefined);
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => logger.error({ reason }, "unhandledRejection"));
}

main().catch((err) => {
  logger.fatal({ err }, "failed to start");
  process.exit(1);
});
