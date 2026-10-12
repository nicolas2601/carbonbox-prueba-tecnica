import { expect, it } from "vitest";
import { upload } from "@/tests/fixtures";
import { activityPoints, completionShare, statusCounts, formatRows } from "./chartModels";

it("Computes honest totals and an empty completion share", () => {
  expect(completionShare({ total: 12, completed: 9, inProgress: 2, failed: 1 })).toBe(75);
  expect(completionShare({ total: 0, completed: 0, inProgress: 0, failed: 0 })).toBe(0);
  expect(statusCounts({ total: 12, completed: 9, inProgress: 2, failed: 1 }).map(item => item.count)).toEqual([9, 2, 1]);
});
it("Plots handled rows chronologically and never invents missing counters", () => {
  const points = activityPoints([
    { ...upload("new", "PENDING"), createdAt: "2026-10-11T00:00:00.000Z", processedRows: null, failedRows: null },
    { ...upload("old"), createdAt: "2026-10-10T00:00:00.000Z", processedRows: 15, failedRows: 10 },
  ]);
  expect(points.map(point => [point.id, point.rows, point.status])).toEqual([["old", 25, "COMPLETED"], ["new", 0, "PENDING"]]);
});
it("Keeps only the latest twelve uploads without mutating input", () => {
  const uploads = Array.from({ length: 14 }, (_, index) => ({ ...upload(String(index)), createdAt: `2026-10-${String(index + 1).padStart(2, "0")}T00:00:00.000Z` }));
  expect(activityPoints(uploads).map(point => point.id)).toEqual(Array.from({ length: 12 }, (_, index) => String(index + 2)));
  expect(uploads[0].id).toBe("0");
});
it("Keeps processed and rejected rows distinct and identifies files instead of repeating dates", () => {
  const [point] = activityPoints([{ ...upload("mixed"), fileName: "a-long-activity-report.csv", processedRows: 15, failedRows: 10,
    createdAt: "2026-10-12T07:14:00.000Z" }]);
  expect(point).toMatchObject({ processed: 15, rejected: 10, rows: 25, reported: true, time: "07:14" });
  expect(point?.shortName.length).toBeLessThanOrEqual(15);
  expect(point?.label).toContain("07:14");
  expect(point?.label).not.toContain("Oct 12");
});
it("Preserves an unreported counter state rather than presenting a measured zero", () => {
  const [point] = activityPoints([{ ...upload("pending", "PENDING"), processedRows: null, failedRows: null }]);
  expect(point).toMatchObject({ reported: false, processed: 0, rejected: 0 });
});
it.each([[1000, "1k"], [50000, "50k"], [100000, "100k"], [1500000, "1.5m"], [0, "0"]])("Formats a compact unclipped row count: %s", (value, expected) => {
  expect(formatRows(Number(value))).toBe(expected);
});
