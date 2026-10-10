import { expect, it } from "vitest";
import { ActivityData } from "./ActivityData";

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
