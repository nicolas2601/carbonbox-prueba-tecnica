import { expect, it } from "vitest";
import { queueSnapshot } from "./queueSnapshot";

const NOW = new Date("2026-10-12T00:00:10.000Z");
it("Projects all statuses and oldest queued age from one grouped result", () => {
  expect(queueSnapshot([{ status: "QUEUED", count: 3n, oldest: new Date("2026-10-12T00:00:00.000Z") },
    { status: "DEAD", count: 1n, oldest: NOW }, { status: "DONE", count: 7n, oldest: NOW }], NOW))
    .toEqual({ queued: 3, dead: 1, done: 7, oldestQueuedAgeSeconds: 10 });
});
it("Shows zero for empty backlog and clamps clock skew without negative ages", () => {
  expect(queueSnapshot([], NOW)).toEqual({ queued: 0, dead: 0, done: 0, oldestQueuedAgeSeconds: 0 });
  expect(queueSnapshot([{ status: "QUEUED", count: 1n, oldest: new Date(NOW.getTime() + 1000) }], NOW).oldestQueuedAgeSeconds).toBe(0);
});
it("Rejects counts that cannot be represented safely", () => {
  expect(() => queueSnapshot([{ status: "QUEUED", count: BigInt(Number.MAX_SAFE_INTEGER) + 1n, oldest: NOW }], NOW)).toThrow();
});
it("Refuses negative counts and invalid dates rather than exporting invented values", () => {
  expect(() => queueSnapshot([{ status: "QUEUED", count: -1n, oldest: NOW }], NOW)).toThrow("Invalid queue metric count");
  expect(() => queueSnapshot([{ status: "QUEUED", count: 1n, oldest: new Date(Number.NaN) }], NOW)).toThrow("Invalid queue metric date");
});
it("Ignores unknown statuses and leaves age zero when no timestamp exists", () => {
  expect(queueSnapshot([{ status: "UNKNOWN", count: 9n, oldest: NOW },
    { status: "QUEUED", count: 1n, oldest: null }], NOW))
    .toEqual({ queued: 1, done: 0, dead: 0, oldestQueuedAgeSeconds: 0 });
});
it("Does not derive age from a zero-count group", () => {
  expect(queueSnapshot([{ status: "QUEUED", count: 0n, oldest: new Date(0) }], NOW).oldestQueuedAgeSeconds).toBe(0);
});
