import { expect, it } from "vitest";
import { upload } from "@/tests/fixtures";
import { rowQuality, elapsedSamples, medianElapsed, largestUploads, formatElapsed } from "./insightModels";

const totals = { total: 2, completed: 1, inProgress: 1, failed: 0 };
it("Uses global row counters, not one partial list, and does not invent absent or empty ratios", () => {
  expect(rowQuality(totals)).toBeNull();
  expect(rowQuality({ ...totals, processedRows: 15, rejectedRows: 10 })).toEqual({ processed: 15, rejected: 10, total: 25, rejectionShare: 40 });
  expect(rowQuality({ ...totals, processedRows: 0, rejectedRows: 0 })?.rejectionShare).toBeNull();
  expect(rowQuality({ ...totals, processedRows: -1, rejectedRows: 10 })).toBeNull();
});
it("Uses terminal timestamps only and omits invalid/negative elapsed samples", () => {
  const items = [
    { ...upload("valid"), createdAt: "2026-10-12T00:00:00Z", updatedAt: "2026-10-12T00:00:03Z" },
    { ...upload("active", "PROCESSING"), updatedAt: "2026-10-12T00:00:10Z" },
    { ...upload("negative"), createdAt: "2026-10-12T00:00:04Z", updatedAt: "2026-10-12T00:00:03Z" },
    { ...upload("invalid"), updatedAt: "invalid" },
  ];
  expect(elapsedSamples(items).map(item => [item.id, item.elapsedMs])).toEqual([["valid", 3000]]);
});
it("Computes a median, including even samples, and returns null with no observed duration", () => {
  expect(medianElapsed([])).toBeNull();
  const items = [1, 3, 7, 9].map((seconds, index) => ({ ...upload(String(index)),
    createdAt: "2026-10-12T00:00:00Z", updatedAt: `2026-10-12T00:00:0${seconds}Z` }));
  expect(medianElapsed(items)).toBe(5000);
  expect(medianElapsed(items.slice(0, 3))).toBe(3000);
});
it("Ranks five real handled counters in the latest twelve, not imagined all-time largest files", () => {
  const items = Array.from({ length: 14 }, (_, index) => ({ ...upload(String(index)),
    createdAt: `2026-10-${String(index + 1).padStart(2, "0")}T00:00:00Z`, processedRows: index === 0 ? 1000000 : index, failedRows: 2 }));
  expect(largestUploads(items).map(item => item.id)).toEqual(["13", "12", "11", "10", "9"]);
  expect(largestUploads([{ ...upload("pending", "PENDING"), processedRows: null, failedRows: null }])).toEqual([]);
});
it.each([[0, "<1 ms"], [500, "500 ms"], [1500, "1.5 s"], [120000, "2 min"], [7200000, "2 h"]])("Formats approximate duration %s", (value, expected) => {
  expect(formatElapsed(Number(value))).toBe(expected);
});
