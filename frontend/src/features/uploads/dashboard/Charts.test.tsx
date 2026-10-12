import { render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ActivityChart, CompletionGauge, CompletionDonut } from "./Charts";
import { activityPoints } from "./chartModels";
import { upload } from "@/tests/fixtures";

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const width = this.tagName === "SPAN" ? (this.textContent?.length ?? 0) * 6 : 480;
    const height = this.tagName === "SPAN" ? 12 : 240;
    return { width, height, x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, toJSON: () => ({}) };
  });
});
afterEach(() => vi.restoreAllMocks());

it.each([1, 2, 12])("Shows %s files as processed/rejected stacks without invented areas", count => {
  const points = activityPoints(Array.from({ length: count }, (_, index) => ({ ...upload(String(index)), processedRows: 15, failedRows: 10 })));
  const { container } = render(<ActivityChart points={points} />);
  expect(container.querySelectorAll(".recharts-bar-rectangle")).toHaveLength(count * 2);
  expect(container.querySelector(".recharts-area-area")).toBeNull();
  for (const path of container.querySelectorAll("path")) expect(path.getAttribute("d")).not.toContain("NaN");
});
it("Uses compact large-value ticks rather than clipped six-digit counts", () => {
  const { container } = render(<ActivityChart points={activityPoints([{ ...upload("large"), processedRows: 100000, failedRows: 0 }])} />);
  const axis = container.querySelector(".recharts-yAxis-tick-labels");
  expect(axis).toHaveTextContent(/\d+(?:\.\d+)?k/);
  expect(axis).not.toHaveTextContent("100000");
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
