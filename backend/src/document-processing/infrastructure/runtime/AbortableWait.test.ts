import { afterEach, expect, it, vi } from "vitest";
import { AbortableWait } from "./AbortableWait";

afterEach(() => { vi.useRealTimers(); });
it("Abort clears the pending timer without waiting", async () => {
  vi.useFakeTimers();
  const controller = new AbortController();
  const waiting = new AbortableWait().wait(10000, controller.signal);
  expect(vi.getTimerCount()).toBe(1);
  controller.abort();
  await waiting;
  expect(vi.getTimerCount()).toBe(0);
});
it("An already aborted signal creates no timer", async () => {
  vi.useFakeTimers();
  const controller = new AbortController();
  controller.abort();
  await new AbortableWait().wait(10000, controller.signal);
  expect(vi.getTimerCount()).toBe(0);
});
it("The timer resolves normally", async () => {
  vi.useFakeTimers();
  const waiting = new AbortableWait().wait(100, new AbortController().signal);
  await vi.advanceTimersByTimeAsync(100);
  await waiting;
  expect(vi.getTimerCount()).toBe(0);
});
