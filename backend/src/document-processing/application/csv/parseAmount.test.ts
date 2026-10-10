import { expect, it } from "vitest";
import { parseAmount } from "./parseAmount";

it.each(["1378.80", "10", " 0.25 ", "001.50"])("Accepts plain positive decimal %s", raw => {
  const result = parseAmount(raw);
  expect(result.isRight()).toBe(true);
  expect(result.value).toBe(Number(raw));
});
it.each(["-10.50", "0", "abc", "", "   ", "0x10", "1e3", "1,5", "Infinity", "NaN", ".5", "1.", "+1", "9".repeat(400)])("Rejects amount %s", raw => {
  expect(parseAmount(raw).isLeft()).toBe(true);
});
it("Explains positivity for a negative amount", () => {
  expect(parseAmount("-10.50").value).toContain("greater than zero");
});
