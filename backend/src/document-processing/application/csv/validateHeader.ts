import { Either } from "../../../shared/domain/Either";
import { InvalidCsvHeaderError } from "./InvalidCsvHeaderError";
import type { CsvColumns } from "./types";

export function validateHeader(_fields: string[]): Either<InvalidCsvHeaderError, CsvColumns> {
  return Either.right({ category: 0, amount: 1, unit: 2, date: 3 });
}
