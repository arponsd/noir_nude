import bcrypt from "bcryptjs";
import zxcvbn from "zxcvbn";

const BCRYPT_ROUNDS = 12;
const MIN_LENGTH = 10;
const MIN_SCORE = 3;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export type PasswordStrengthResult =
  | { ok: true }
  | { ok: false; reason: "TOO_SHORT" | "TOO_WEAK"; feedback?: string };

export function validatePasswordStrength(
  password: string,
  context?: { email?: string; name?: string },
): PasswordStrengthResult {
  if (password.length < MIN_LENGTH) {
    return { ok: false, reason: "TOO_SHORT" };
  }
  const userInputs = [context?.email, context?.name].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  const result = zxcvbn(password, userInputs);
  if (result.score < MIN_SCORE) {
    const warning = result.feedback.warning || result.feedback.suggestions.join(" ");
    const feedback = warning.length > 0 ? warning : "Password is too weak.";
    return { ok: false, reason: "TOO_WEAK", feedback };
  }
  return { ok: true };
}
