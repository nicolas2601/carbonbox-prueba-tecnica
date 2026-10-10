import { expect, it } from "vitest";
import { parseCalendarDate } from "./parseCalendarDate";

it.each(["2024-01-15", "2024-02-29", "2000-02-29", "0099-01-01"])("Accepts actual calendar date %s", raw => {
  const result = parseCalendarDate(raw);
  expect(result.isRight()).toBe(true);
  if (result.isLeft()) throw new Error(result.value);
  expect(result.value.toISOString()).toBe(`${raw}T00:00:00.000Z`);
});
