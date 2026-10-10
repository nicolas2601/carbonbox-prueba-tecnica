import { expect, it } from "vitest";
import { summarizeRowErrors } from "./summarizeRowErrors";
import type { RowError } from "./types";

const errors: RowError[] = Array.from({ length: 12 }, (_, index) => ({ line: index + 2, field: "amount", reason: "Must be positive" }));
it("No errors", () => { expect(summarizeRowErrors([], 5)).toBeNull(); });
it("Few errors are all listed", () => {
  const result = summarizeRowErrors(errors.slice(0, 2), 5);
  expect(result).toBe("2 rows rejected. line 2: amount - Must be positive; line 3: amount - Must be positive");
});
it("Many errors are capped", () => {
  const result = summarizeRowErrors(errors, 5);
  expect(result).toContain("12 rows rejected");
  expect(result?.match(/line \d+:/g)).toHaveLength(5);
  expect(result).toContain("7 more omitted");
});
it.each([0, -1, 1.5, NaN, Infinity])("Invalid or zero limit lists none: %s", limit => {
  expect(summarizeRowErrors(errors, limit)).toBe("12 rows rejected. 12 more omitted");
});
