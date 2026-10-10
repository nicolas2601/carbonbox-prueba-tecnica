import { Either } from "../../../shared/domain/Either";

export function parseCalendarDate(raw: string): Either<string, Date> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return Either.left("Must use YYYY-MM-DD format");
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    return Either.left("Must be a real calendar date");
  }
  return Either.right(date);
}
