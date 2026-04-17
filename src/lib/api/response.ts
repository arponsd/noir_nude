import { ZodError } from "zod";
import { ERROR_CODES, type ErrorCode } from "@/lib/constants";
import logger from "@/lib/utils/logger";

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

export function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

export function fail(code: string, message: string, details?: unknown): ApiResponse<never> {
  const error: { code: string; message: string; details?: unknown } = { code, message };
  if (details !== undefined) error.details = details;
  return { ok: false, error };
}

export class AuthError extends Error {
  code: ErrorCode = ERROR_CODES.UNAUTHORIZED;
  constructor(message = "Authentication required", code?: ErrorCode) {
    super(message);
    this.name = "AuthError";
    if (code) this.code = code;
  }
}

export class ForbiddenError extends Error {
  code: ErrorCode = ERROR_CODES.FORBIDDEN;
  constructor(message = "Forbidden", code?: ErrorCode) {
    super(message);
    this.name = "ForbiddenError";
    if (code) this.code = code;
  }
}

export class NotFoundError extends Error {
  code: ErrorCode = ERROR_CODES.NOT_FOUND;
  constructor(message = "Not found", code?: ErrorCode) {
    super(message);
    this.name = "NotFoundError";
    if (code) this.code = code;
  }
}

export class ValidationError extends Error {
  code: ErrorCode = ERROR_CODES.VALIDATION_FAILED;
  details?: unknown;
  constructor(message = "Validation failed", code?: ErrorCode, details?: unknown) {
    super(message);
    this.name = "ValidationError";
    if (code) this.code = code;
    if (details !== undefined) this.details = details;
  }
}

export class RateLimitError extends Error {
  code: ErrorCode = ERROR_CODES.RATE_LIMITED;
  retryAfter?: number;
  constructor(message = "Too many requests", retryAfter?: number) {
    super(message);
    this.name = "RateLimitError";
    if (retryAfter !== undefined) this.retryAfter = retryAfter;
  }
}

type Handler<Args extends unknown[]> = (...args: Args) => Promise<Response> | Response;

async function reportToSentry(err: unknown): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.SENTRY_DSN) return;
  try {
    const sentry = await import("@sentry/nextjs");
    sentry.captureException(err);
  } catch {
    // reason: Sentry failure must never break the request.
  }
}

type NormalizedError = {
  status: number;
  body: ApiResponse<never>;
  headers?: Record<string, string>;
};

function normalizeError(err: unknown): NormalizedError {
  if (err instanceof ZodError) {
    return {
      status: 400,
      body: fail(ERROR_CODES.VALIDATION_FAILED, "Invalid input.", err.flatten()),
    };
  }
  if (err instanceof ValidationError) {
    return {
      status: 400,
      body: fail(err.code, err.message, err.details),
    };
  }
  if (err instanceof AuthError) {
    return { status: 401, body: fail(err.code, err.message) };
  }
  if (err instanceof ForbiddenError) {
    return { status: 403, body: fail(err.code, err.message) };
  }
  if (err instanceof NotFoundError) {
    return { status: 404, body: fail(err.code, err.message) };
  }
  if (err instanceof RateLimitError) {
    const headers: Record<string, string> = {};
    if (err.retryAfter !== undefined) {
      headers["Retry-After"] = String(err.retryAfter);
    }
    return {
      status: 429,
      body: fail(err.code, err.message),
      headers,
    };
  }
  return {
    status: 500,
    body: fail(ERROR_CODES.INTERNAL_ERROR, "Something went wrong."),
  };
}

export function safeRoute<Args extends unknown[]>(handler: Handler<Args>): Handler<Args> {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      const normalized = normalizeError(err);
      if (normalized.status >= 500) {
        logger.error({ err }, "route handler failed");
        await reportToSentry(err);
      } else {
        logger.warn({ err, status: normalized.status }, "route handler rejected");
      }
      return Response.json(normalized.body, {
        status: normalized.status,
        headers: normalized.headers,
      });
    }
  };
}

type ActionFn<Args extends unknown[], T> = (...args: Args) => Promise<T> | T;

export function safeAction<Args extends unknown[], T>(
  fn: ActionFn<Args, T>,
): (...args: Args) => Promise<ApiResponse<T>> {
  return async (...args: Args): Promise<ApiResponse<T>> => {
    try {
      const data = await fn(...args);
      return ok(data);
    } catch (err) {
      const normalized = normalizeError(err);
      if (normalized.status >= 500) {
        logger.error({ err }, "server action failed");
        await reportToSentry(err);
      } else {
        logger.warn({ err, status: normalized.status }, "server action rejected");
      }
      return normalized.body;
    }
  };
}
