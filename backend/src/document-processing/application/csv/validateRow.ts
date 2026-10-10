import { Either } from "../../../shared/domain/Either";
import type { ActivityRow, CsvColumns, RowError } from "./types";

export function validateRow(fields: string[], columns: CsvColumns, line: number): Either<RowError, ActivityRow> {
  for (const field of ["category", "amount", "unit", "date"] as const) {
    if (!fields[columns[field]]?.trim()) return Either.left({ line, field, reason: "Required value is missing" });
  }
  return Either.right({ category: fields[columns.category]!.trim(), amount: Number(fields[columns.amount]),
    unit: fields[columns.unit]!.trim(), date: new Date(`${fields[columns.date]}T00:00:00Z`) });
}
