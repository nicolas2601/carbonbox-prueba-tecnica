import { afterEach, expect, it, vi } from "vitest";
import { SystemClock } from "./SystemClock";

afterEach(() => { vi.useRealTimers(); });
it("System clock reads current time at each call", () => {
  vi.useFakeTimers();
  const first = new Date("2024-01-15T00:00:00Z");
  const second = new Date("2024-01-16T00:00:00Z");
  vi.setSystemTime(first);
  const clock = new SystemClock();
  expect(clock.now()).toEqual(first);
  vi.setSystemTime(second);
  expect(clock.now()).toEqual(second);
});
