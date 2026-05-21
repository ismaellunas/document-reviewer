/**
 * Domain error hierarchy for the service / repository layers.
 *
 * Services throw these instead of writing HTTP responses. The HTTP layer
 * (`withAuth` / `errorResponse` in `lib/http.ts`) maps them to JSON
 * responses with the right status code, and server components map them
 * to `redirect()` / `notFound()` calls as appropriate.
 *
 * The `code` property is a stable machine-readable identifier; the
 * `message` is human-readable copy intended for end users.
 */

export type DomainErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "CONFLICT"
  | "RLS_BLOCKED"
  | "INTERNAL";

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: DomainErrorCode,
    status: number,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized") {
    super("UNAUTHORIZED", 401, message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Access Denied") {
    super("FORBIDDEN", 403, message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    const msg = id
      ? `${capitalize(resource)} not found`
      : `${capitalize(resource)} not found`;
    super("NOT_FOUND", 404, msg, { resource, id });
    this.name = "NotFoundError";
  }
}

export class ValidationError extends DomainError {
  constructor(message = "Validation failed", details?: unknown) {
    super("VALIDATION_FAILED", 400, message, details);
    this.name = "ValidationError";
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: unknown) {
    super("CONFLICT", 409, message, details);
    this.name = "ConflictError";
  }
}

/**
 * Thrown when a Supabase write succeeds at the wire level but RLS silently
 * filtered the operation to zero rows. Surfacing this distinctly avoids the
 * "API returns 200, nothing actually changed" footgun.
 */
export class RlsBlockedError extends DomainError {
  constructor(message = "Operation was blocked by a database policy") {
    super("RLS_BLOCKED", 403, message);
    this.name = "RlsBlockedError";
  }
}

export function isDomainError(err: unknown): err is DomainError {
  return err instanceof DomainError;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}
