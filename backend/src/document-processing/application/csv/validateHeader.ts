import { Either } from "../../../shared/domain/Either";
import { InvalidCsvHeaderError } from "./InvalidCsvHeaderError";
import type { CsvColumns } from "./types";

export function validateHeader(fields: string[]): Either<InvalidCsvHeaderError, CsvColumns> {
  const normalized = fields.map(field => field.trim().toLowerCase());
  for (const required of ["category", "amount", "unit", "date"]) {
    const occurrences = normalized.filter(field => field === required).length;
    if (occurrences !== 1) {
      return Either.left(new InvalidCsvHeaderError(`${occurrences === 0 ? "Missing" : "Duplicated"} column: ${required}`));
    }
  }
  return Either.right({ category: normalized.indexOf("category"), amount: normalized.indexOf("amount"),
    unit: normalized.indexOf("unit"), date: normalized.indexOf("date") });
}
