import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { logger } from "../lib/logger";

/** Adds a request id header and logs one line per completed API request. */
export const requestLog: RequestHandler = (req, res, next) => {
  const id = randomUUID();
  const start = process.hrtime.bigint();
  res.setHeader("X-Request-Id", id);
  res.on("finish", () => {
    if (!req.path.startsWith("/api")) return;
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const line = { id, method: req.method, path: req.path, status: res.statusCode, ms: Math.round(ms), role: req.user?.role };
    if (res.statusCode >= 500) logger.error(line, "request");
    else if (res.statusCode >= 400) logger.warn(line, "request");
    else logger.info(line, "request");
  });
  next();
};
