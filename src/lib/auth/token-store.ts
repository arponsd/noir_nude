// ASK to database agent: move AuthToken model to src/lib/db/models/AuthToken.ts in a
// follow-up round. The User schema lacks expiry fields for email verification tokens
// and single-use tracking for password reset tokens, so this sibling collection is
// colocated in the auth module as an MVP compromise.

import { Schema, model, models } from "mongoose";
import type { Model, InferSchemaType, Types } from "mongoose";

export const AUTH_TOKEN_TYPES = ["email_verify", "password_reset"] as const;
export type AuthTokenType = (typeof AUTH_TOKEN_TYPES)[number];

const authTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: AUTH_TOKEN_TYPES, required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

authTokenSchema.index({ tokenHash: 1 }, { unique: true });
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type AuthTokenDoc = InferSchemaType<typeof authTokenSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const AuthToken: Model<AuthTokenDoc> =
  (models.AuthToken as Model<AuthTokenDoc> | undefined) ??
  model<AuthTokenDoc>("AuthToken", authTokenSchema);
