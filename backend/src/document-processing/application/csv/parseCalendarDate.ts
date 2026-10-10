import { Either } from "../../../shared/domain/Either";

export function parseCalendarDate(raw: string): Either<string, Date> {
  return Either.right(new Date(`${raw}T00:00:00.000Z`));
}
