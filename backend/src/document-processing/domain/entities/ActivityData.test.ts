import { expect, it } from "vitest";
import { ActivityData } from "./ActivityData";
import { InvalidActivityDataError } from "../errors/InvalidActivityDataError";

const date = new Date("2024-01-15T00:00:00Z");
it.each([
  { category: "Electricity", amount: 150.5, unit: "kWh" },
  { category: "  Waste  ", amount: 45.8, unit: " kg " },
])("A valid row is accepted and text fields are trimmed: $category", props => {
  const result = ActivityData.create({ id: "row-1", uploadId: "upload-1", ...props, date });
  expect(result.isRight()).toBe(true);
  if (result.isLeft()) throw result.value;
  expect(result.value).toMatchObject({ ...props, category: props.category.trim(), unit: props.unit.trim(), date });
});

it.each([
  { field: "category", change: { category: "   " } },
  { field: "unit", change: { unit: "   " } },
  ...[-10.5, 0, NaN, Infinity, -Infinity].map(amount => ({ field: "amount", change: { amount } })),
  { field: "date", change: { date: new Date("not a date") } },
])("Rejects offending field $field", ({ field, change }) => {
  const result = ActivityData.create({ id: "r", uploadId: "u", category: "Water", unit: "m3", amount: 10, date, ...change });
  expect(result.isLeft()).toBe(true);
  expect(result.value).toBeInstanceOf(InvalidActivityDataError);
  expect(result.value).toMatchObject({ field });
});
