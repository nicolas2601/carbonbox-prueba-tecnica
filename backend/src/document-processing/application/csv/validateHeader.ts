import { Either } from "../../../shared/domain/Either";
import { InvalidCsvHeaderError } from "./InvalidCsvHeaderError";
import type { CsvColumns } from "./types";

export function validateHeader(fields: string[]): Either<InvalidCsvHeaderError, CsvColumns> {
  const normalized = fields.map(field => field.trim().toLowerCase());
  return Either.right({ category: normalized.indexOf("category"), amount: normalized.indexOf("amount"),
    unit: normalized.indexOf("unit"), date: normalized.indexOf("date") });
}
