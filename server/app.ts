import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import { isProd } from "./config";
import { attachPersona } from "./middleware/persona";
import { requestLog } from "./middleware/request-log";
import { errorHandler, notFoundHandler } from "./middleware/errors";
import { apiRouter } from "./routes";

let ready = false;
/** Called once the database schema and demo data are in place. */
export function markReady(): void {
  ready = true;
}

/**
 * Builds the Express app without listening. Keeping construction separate
 * from `listen` lets tests mount the app directly.
 */
export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    helmet({
      // The SPA loads fonts/scripts from itself only; PDF.js worker is self-hosted.
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
              fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
              imgSrc: ["'self'", "data:", "blob:"],
              mediaSrc: ["'self'", "blob:"],
              connectSrc: ["'self'", "ws:", "wss:"],
              workerSrc: ["'self'", "blob:"],
              objectSrc: ["'none'"],
              frameSrc: ["'self'", "blob:"],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(requestLog);

  // The port opens immediately (hosts expect that); API calls wait for setup.
  app.use("/api", (_req, res, next) => {
    if (ready) return next();
    res.setHeader("Retry-After", "3");
    res.status(503).json({ error: { code: "starting", message: "Setting up demo data. Try again in a moment." } });
  });

  app.use(attachPersona);

  app.use("/api", apiRouter);
  app.use("/api", notFoundHandler);
  app.use(errorHandler);

  return app;
}
