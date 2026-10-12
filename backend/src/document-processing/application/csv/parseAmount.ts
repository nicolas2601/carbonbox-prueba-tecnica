import { Either } from "../../../shared/domain/Either";

const DECIMAL = /^-?\d+(?:\.\d+)?$/;

export function parseAmount(raw: string): Either<string, number> {
  const value = raw.trim();
  if (!DECIMAL.test(value)) return Either.left("Must be a plain decimal number");
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return Either.left("Must be finite and greater than zero");
  return Either.right(amount);
}
