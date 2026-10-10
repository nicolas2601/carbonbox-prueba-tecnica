import { expect, it } from "vitest";
import { validateHeader } from "./validateHeader";

it("A canonical header is accepted", () => {
  const result = validateHeader(["category", "amount", "unit", "date"]);
  expect(result.isRight()).toBe(true);
  expect(result.value).toEqual({ category: 0, amount: 1, unit: 2, date: 3 });
});

it("Order, case, spaces and extra columns are tolerated", () => {
  expect(validateHeader([" Date ", "UNIT", "note", "Amount", "category"]).value)
    .toEqual({ date: 0, unit: 1, amount: 3, category: 4 });
});
it("A byte order mark on the first column is ignored", () => {
  expect(validateHeader(["﻿category", "amount", "unit", "date"]).value)
    .toEqual({ category: 0, amount: 1, unit: 2, date: 3 });
});
