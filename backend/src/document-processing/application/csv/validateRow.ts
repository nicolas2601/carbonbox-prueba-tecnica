import { Either } from "../../../shared/domain/Either";
import type { ActivityRow, CsvColumns, RowError } from "./types";

export function validateRow(fields: string[], columns: CsvColumns, _line: number): Either<RowError, ActivityRow> {
  return Either.right({ category: fields[columns.category]!.trim(), amount: Number(fields[columns.amount]),
    unit: fields[columns.unit]!.trim(), date: new Date(`${fields[columns.date]}T00:00:00Z`) });
}
