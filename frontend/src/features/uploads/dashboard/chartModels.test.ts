import { expect, it } from "vitest";
import { upload } from "@/tests/fixtures";
import { activityPoints, completionShare, statusCounts } from "./chartModels";

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
