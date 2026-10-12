import { render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ActivityChart, CompletionGauge, CompletionDonut } from "./Charts";
import { LargestUploadsChart } from "./LargestUploadsChart";

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const width = this.tagName === "SPAN" ? (this.textContent?.length ?? 0) * 6 : 480;
    const height = this.tagName === "SPAN" ? 12 : 240;
    return { width, height, x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, toJSON: () => ({}) };
  });
});
afterEach(() => vi.restoreAllMocks());

it.each([1, 2, 12])("Shows %s files as processed/rejected stacks without invented areas", count => {
  const points = Array.from({ length: count }, (_, index) => ({ id: String(index), fileName: `file-${index}.csv`, shortName: `file-${index}.csv`, label: `file-${index}.csv 10:00`, date: "2026-10-12T10:00:00Z", time: "10:00", processed: 15, rejected: 10, reported: true, rows: 25, status: "COMPLETED" as const }));
  const { container } = render(<ActivityChart points={points} />);
  expect(container.querySelectorAll(".recharts-rectangle")).toHaveLength(count * 2);
  expect(container.querySelector(".recharts-area-area")).toBeNull();
  for (const path of container.querySelectorAll("path")) expect(path.getAttribute("d")).not.toContain("NaN");
});
it.each([1, 3, 6])("Uses readable horizontal stacks with full filenames and values for %s files", count => {
  const points = Array.from({ length: count }, (_, index) => ({ id: String(index), fileName: `full-file-${index}.csv`, shortName: `full-file-${index}.csv`, label: `full-file-${index}.csv 10:00`, date: "2026-10-12T10:00:00Z", time: "10:00", processed: 15, rejected: 10, reported: true, rows: 25, status: "COMPLETED" as const }));
  const { container } = render(<LargestUploadsChart points={points} orientation="horizontal" />);
  expect(container.querySelector(".recharts-yAxis")).toBeInTheDocument();
  expect(container.textContent).toContain("full-file-0.csv");
  expect(container.textContent).toContain("25");
});
it("Shows numeric totals above vertical columns for twelve files", () => {
  const points = Array.from({ length: 12 }, (_, index) => ({ id: String(index), fileName: `file-${index}.csv`, shortName: `file-${index}.csv`, label: `file-${index}.csv 10:00`, date: "2026-10-12T10:00:00Z", time: "10:00", processed: 100000, rejected: 0, reported: true, rows: 100000, status: "COMPLETED" as const }));
  const { container } = render(<LargestUploadsChart points={points} />);
  expect(container.querySelector(".activity-horizontal")).toBeNull();
  expect(container.querySelector(".recharts-label-list .recharts-label")?.textContent).toContain("100k");
});
it("Uses compact large-value ticks rather than clipped six-digit counts", () => {
  const points = Array.from({ length: 12 }, (_, index) => ({ id: String(index), fileName: `file-${index}.csv`, shortName: `file-${index}.csv`, label: `file-${index}.csv 10:00`, date: "2026-10-12T10:00:00Z", time: "10:00", processed: 100000, rejected: 0, reported: true, rows: 100000, status: "COMPLETED" as const }));
  const { container } = render(<LargestUploadsChart points={points} />);
  const axis = container.querySelector(".recharts-yAxis-tick-labels");
  expect(axis).toHaveTextContent(/\d+(?:\.\d+)?k/);
  expect(axis).not.toHaveTextContent("100000");
});
it("Suppresses Recharts category-wide tooltip cursor shading", () => {
  const point = { id: "file-1", fileName: "file-1.csv", shortName: "file-1.csv", label: "file-1.csv 10:00", date: "2026-10-12T10:00:00Z", time: "10:00", processed: 15, rejected: 10, reported: true, rows: 25, status: "COMPLETED" as const };
  const { container } = render(<LargestUploadsChart points={[point]} orientation="horizontal" />);
  expect(container.querySelectorAll(".recharts-tooltip-cursor")).toHaveLength(0);
});

it("Renders no data shapes for an empty series", () => {
  const { container } = render(<ActivityChart points={[]} />);
  expect(container.querySelector(".recharts-area-area")).toBeNull();
  expect(container.querySelector(".recharts-bar-rectangle")).toBeNull();
});
it("Renders zero-total completion graphics without invalid paths", () => {
  const stats = { total: 0, completed: 0, inProgress: 0, failed: 0 };
  const { container } = render(<><CompletionGauge stats={stats} /><CompletionDonut stats={stats} /></>);
  expect(container.querySelectorAll("svg")).toHaveLength(2);
  for (const path of container.querySelectorAll("path")) expect(path.getAttribute("d")).not.toContain("NaN");
});
it("Keeps the decorative donut out of keyboard focus", () => {
  const { container } = render(<CompletionDonut stats={{ total: 1, completed: 1, inProgress: 0, failed: 0 }} />);
  expect(container.querySelector(".recharts-pie")).toHaveAttribute("tabindex", "-1");
});
