import { expect, it } from "vitest";
import { validateHeader } from "./validateHeader";

it("A canonical header is accepted", () => {
  const result = validateHeader(["category", "amount", "unit", "date"]);
  expect(result.isRight()).toBe(true);
  expect(result.value).toEqual({ category: 0, amount: 1, unit: 2, date: 3 });
});
