import { Either } from "../../../shared/domain/Either";
import { parseAmount } from "./parseAmount";
import { parseCalendarDate } from "./parseCalendarDate";
import type { ActivityRow, CsvColumns, RowError } from "./types";

export function validateRow(fields: string[], columns: CsvColumns, line: number): Either<RowError, ActivityRow> {
  const category = fields[columns.category]?.trim() ?? "";
  if (!category) return Either.left({ line, field: "category", reason: "Required value is missing" });
  const amount = parseAmount(fields[columns.amount] ?? "");
  if (amount.isLeft()) return Either.left({ line, field: "amount", reason: amount.value });
  const unit = fields[columns.unit]?.trim() ?? "";
  if (!unit) return Either.left({ line, field: "unit", reason: "Required value is missing" });
  const date = parseCalendarDate(fields[columns.date]?.trim() ?? "");
  if (date.isLeft()) return Either.left({ line, field: "date", reason: date.value });
  return Either.right({ category, amount: amount.value, unit, date: date.value });
}
