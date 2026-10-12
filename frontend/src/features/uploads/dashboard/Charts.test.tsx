import { render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ActivityChart, CompletionGauge, CompletionDonut } from "./Charts";
import { activityPoints } from "./chartModels";
import { upload } from "@/tests/fixtures";

beforeEach(() => vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
  width: 480, height: 240, x: 0, y: 0, top: 0, left: 0, right: 480, bottom: 240, toJSON: () => ({}),
}));
afterEach(() => vi.restoreAllMocks());

it("Registers area data inside its SVG reveal group without invalid geometry", () => {
  const points = activityPoints([upload("first"), { ...upload("second"), processedRows: 10 }]);
  const { container } = render(<ActivityChart points={points} />);
  expect(container.querySelector(".area-reveal-mask")).toBeInTheDocument();
  const area = container.querySelector(".recharts-area-area");
  expect(area).toBeInTheDocument();
  expect(area?.getAttribute("d")).not.toContain("NaN");
});
it("Shows a single sample as one bar rather than an invented area", () => {
  const { container } = render(<ActivityChart points={activityPoints([upload("one")])} />);
  expect(container.querySelectorAll(".recharts-bar-rectangle")).toHaveLength(1);
  expect(container.querySelector(".recharts-area-area")).toBeNull();
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
