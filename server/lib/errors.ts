/**
 * Typed HTTP errors. Throw these from services/routes; the central error
 * handler maps them to JSON responses. Anything else becomes a 500.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = "error",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class BadRequest extends HttpError {
  constructor(message = "Bad request", details?: unknown) {
    super(400, message, "bad_request", details);
  }
}
export class Unauthorized extends HttpError {
  constructor(message = "Select a role to continue") {
    super(401, message, "no_persona");
  }
}
export class Forbidden extends HttpError {
  constructor(message = "Your role cannot perform this action") {
    super(403, message, "forbidden");
  }
}
export class NotFound extends HttpError {
  constructor(what = "Resource") {
    super(404, `${what} not found`, "not_found");
  }
}
export class Conflict extends HttpError {
  constructor(message = "Conflict") {
    super(409, message, "conflict");
  }
}
