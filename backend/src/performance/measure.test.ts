import { expect, it } from "vitest";
import { percentile, measure } from "./measure";

it("Computes nearest-rank p95 rather than silently substituting p97.5", () => {
  const values = Array.from({ length: 100 }, (_, index) => 100 - index);
  expect(percentile(values, 0.5)).toBe(50);
  expect(percentile(values, 0.95)).toBe(95);
  expect(percentile(values, 0.99)).toBe(99);
  expect(values[0]).toBe(100);
});
it("Rejects missing, invalid or impossible measurement samples", () => {
  for (const values of [[], [NaN], [Infinity], [-1]]) expect(() => percentile(values, 0.95)).toThrow();
  for (const rank of [0, 1.1, NaN]) expect(() => percentile([1], rank)).toThrow();
});
it("Measures a real operation using the injected monotonic clock", async () => {
  const times = [10, 42];
  expect(await measure(async () => "result", () => times.shift() ?? 0)).toEqual({ value: "result", elapsedMs: 32 });
  const failure = new Error("operation failed");
  await expect(measure(async () => { throw failure; }, () => 1)).rejects.toBe(failure);
});
