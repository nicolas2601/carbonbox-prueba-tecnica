import { expect, it } from "vitest";
import { validateRow } from "./validateRow";
import type { CsvColumns } from "./types";

const columns: CsvColumns = { category: 0, amount: 1, unit: 2, date: 3 };
it("A valid record is accepted", () => {
  const result = validateRow(["Electricity", "1378.80", "kWh", "2024-04-11"], columns, 2);
  expect(result.isRight()).toBe(true);
  expect(result.value).toEqual({ category: "Electricity", amount: 1378.8, unit: "kWh", date: new Date("2024-04-11T00:00:00Z") });
});
it("Values are trimmed and a quoted comma is kept", () => {
  const result = validateRow(["  Fuel, Diesel ", "10", " L ", "2024-01-15"], columns, 16);
  expect(result.isRight()).toBe(true);
  expect(result.value).toMatchObject({ category: "Fuel, Diesel", amount: 10, unit: "L" });
});
it("Columns are read by position from the header mapping", () => {
  const result = validateRow(["2024-01-15", "L", "50.5", "Diesel"], { date: 0, unit: 1, amount: 2, category: 3 }, 3);
  expect(result.isRight()).toBe(true);
  expect(result.value).toEqual({ category: "Diesel", amount: 50.5, unit: "L", date: new Date("2024-01-15T00:00:00Z") });
});

it.each([
  { fields: ["   ", "10", "kWh", "2024-01-15"], field: "category" },
  { fields: ["Electricity", "10", "   ", "2024-01-15"], field: "unit" },
  { fields: ["Electricity", "10", "kWh"], field: "date" },
  { fields: [], field: "category" },
])("Blank or missing field is rejected: $field", ({ fields, field }) => {
  const result = validateRow(fields, columns, 7);
  expect(result.isLeft()).toBe(true);
  expect(result.value).toMatchObject({ line: 7, field });
});
