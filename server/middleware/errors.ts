import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors";
import { logger } from "../lib/logger";
import { isProd } from "../config";

/** JSON 404 for anything under /api that no router claimed. */
export const notFoundHandler: RequestHandler = (req, res) => {
  const message = `No route for ${req.method} ${req.path}`;
  res.status(404).json({ error: message, message, code: "not_found" });
};

/** Single error handler. Never leaks stack traces in production. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (res.headersSent) return;

  if (err instanceof HttpError) {
    if (err.status >= 500) logger.error({ err, path: req.path }, err.message);
    res.status(err.status).json({ error: err.message, message: err.message, code: err.code, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    res.status(400).json({ error: "Validation failed", message: "Validation failed", code: "bad_request", details });
    return;
  }

  // body-parser errors carry a status/type.
  const anyErr = err as { status?: number; statusCode?: number; type?: string; code?: string; message?: string };
  const status = anyErr.status ?? anyErr.statusCode;
  if (status && status >= 400 && status < 500) {
    const message = anyErr.message ?? "Bad request";
    res.status(status).json({ error: message, message, code: anyErr.code ?? anyErr.type ?? "bad_request" });
    return;
  }

  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
  const message = isProd ? "Internal server error" : (err as Error).message;
  res.status(500).json({ error: message, message, code: "internal" });
};
