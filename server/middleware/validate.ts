import type { RequestHandler } from "express";
import type { ZodTypeAny, z } from "zod";
import { BadRequest } from "../lib/errors";

type Source = "body" | "query" | "params";

/**
 * Validate one request part against a Zod schema and replace it with the
 * parsed (coerced, stripped) value. Throws 400 with field-level details.
 */
export function validate<S extends ZodTypeAny>(schema: S, source: Source = "body"): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
      return next(new BadRequest("Validation failed", details));
    }
    (req as unknown as Record<Source, unknown>)[source] = result.data;
    next();
  };
}

/** Typed accessor for a body validated by `validate(schema)`. */
export function body<S extends ZodTypeAny>(req: { body: unknown }, _schema: S): z.infer<S> {
  return req.body as z.infer<S>;
}
