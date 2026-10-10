import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { validateHeader } from "./validateHeader";
import { validateRow } from "./validateRow";

// Only a fixture adapter, not a general-purpose CSV tokenizer.
function fixtureRecords(): string[][] {
  const file = new URL("../../../../../samples/sample-invalid.csv", import.meta.url);
  return readFileSync(file, "utf8").trimEnd().split(/\r?\n/)
    .map(line => line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
      .map(field => field.replace(/^"|"$/g, "")));
}

it("Fixture has 15 valid rows and 10 rejected rows at the documented lines", () => {
  const [header = [], ...records] = fixtureRecords();
  const columns = validateHeader(header);
  if (columns.isLeft()) throw columns.value;
  const results = records.map((fields, index) => validateRow(fields, columns.value, index + 2));
  const valid = results.filter(result => result.isRight());
  const rejected = results.flatMap(result => result.isLeft() ? [result.value] : []);
  expect(records).toHaveLength(25);
  expect(valid).toHaveLength(15);
  expect(rejected).toHaveLength(10);
  expect(rejected.map(error => error.line)).toEqual([3, 5, 7, 9, 11, 13, 15, 17, 19, 21]);
  expect(rejected.map(error => error.field)).toEqual(["amount", "amount", "amount", "amount", "category", "unit", "date", "date", "date", "date"]);
  expect(valid.some(result => result.value.category === "Fuel, Diesel")).toBe(true);
});
