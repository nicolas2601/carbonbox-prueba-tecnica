import { expect, it } from "vitest";
import { DomainError } from "../../../shared/domain/DomainError";
import { InvalidCsvHeaderError } from "./InvalidCsvHeaderError";
import type { ActivityRow, CsvColumns, RowError } from "./types";

it("CSV header errors have a unique stable code", () => {
  const error = new InvalidCsvHeaderError("Missing unit");
  expect(error).toBeInstanceOf(DomainError);
  expect(error.code).toBe("INVALID_CSV_HEADER");
  expect(error.message).toBe("Missing unit");
});
const columns: CsvColumns = { category: 0, amount: 1, unit: 2, date: 3 };
const error: RowError = { line: 2, field: "amount", reason: "Must be positive" };
const row: ActivityRow = { category: "Water", amount: 1, unit: "m3", date: new Date("2024-01-01") };
void [columns, error, row];
