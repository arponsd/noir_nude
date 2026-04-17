import { z } from "zod";

/**
 * MongoDB ObjectId helpers for route handlers + actions.
 *
 * Routes receive dynamic path segments as plain strings — we validate the shape
 * inline rather than hitting Mongoose to keep the handlers free of DB imports.
 */
const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;

export function isObjectId(value: string): boolean {
  return OBJECT_ID_REGEX.test(value);
}

export const objectIdParamSchema = z
  .string()
  .trim()
  .regex(OBJECT_ID_REGEX, { message: "Invalid id" });

export const objectIdRouteParamsSchema = z.object({ id: objectIdParamSchema }).strict();

export const itemIdParamSchema = z.string().trim().min(1).max(128);
