import { ERROR_CODES, ORDER_TRANSITIONS, type OrderStatus } from "@/lib/constants";
import { ValidationError } from "@/lib/api/response";

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = ORDER_TRANSITIONS[from];
  return allowed.includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new ValidationError(
      `Cannot transition order from "${from}" to "${to}".`,
      ERROR_CODES.ORDER_NOT_CANCELLABLE,
    );
  }
}
