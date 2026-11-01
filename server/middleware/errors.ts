import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors";
import { logger } from "../lib/logger";
import { isProd } from "../config";

/** JSON 404 for anything under /api that no router claimed. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { code: "not_found", message: `No route for ${req.method} ${req.path}` } });
};

/** Single error handler. Never leaks stack traces in production. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (res.headersSent) return;

  if (err instanceof HttpError) {
    if (err.status >= 500) logger.error({ err, path: req.path }, err.message);
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "bad_request",
        message: "Validation failed",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    });
    return;
  }

  // Multer and body-parser errors carry a status/type.
  const anyErr = err as { status?: number; statusCode?: number; type?: string; code?: string; message?: string };
  const status = anyErr.status ?? anyErr.statusCode;
  if (status && status >= 400 && status < 500) {
    res.status(status).json({ error: { code: anyErr.code ?? anyErr.type ?? "bad_request", message: anyErr.message ?? "Bad request" } });
    return;
  }

  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
  res.status(500).json({
    error: {
      code: "internal",
      message: isProd ? "Internal server error" : (err as Error).message,
      ...(isProd ? {} : { stack: (err as Error).stack }),
    },
  });
};
