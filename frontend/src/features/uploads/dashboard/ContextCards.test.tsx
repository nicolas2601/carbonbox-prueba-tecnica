import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { upload } from "@/tests/fixtures";
const { charts, fixture } = vi.hoisted(() => ({ charts: { CompletionGauge: vi.fn(() => null), LargestUploadsChart: vi.fn(() => null) }, fixture: vi.fn() }));
vi.mock("./LazyCharts", () => charts);
vi.mock("@/lib/api/uploads", () => ({ listUploads: fixture, getStats: vi.fn(), getUpload: vi.fn(), getUploadResults: vi.fn(), createUpload: vi.fn() }));

import { queryHarness } from "@/tests/queryHarness";
import { LargestUploadsCard } from "./LargestUploadsCard";
import { CompletionArcCard } from "./CompletionArcCard";

it("Lists largest real uploads with values, links, and scoped chart data", () => {
  const items = [5, 20, 15].map((rows, index) => ({ ...upload(String(index)), processedRows: rows, failedRows: 0 }));
  render(<LargestUploadsCard uploads={items} />);
  const list = screen.getByRole("list", { name: "Largest recent uploads" });
  expect(within(list).getAllByRole("link").map(link => link.textContent)).toEqual(["1.csv", "2.csv", "0.csv"]);
  expect(within(list).getByText("20")).toBeVisible();
  expect(charts.LargestUploadsChart).toHaveBeenCalledWith(expect.objectContaining({ orientation: "horizontal" }), undefined);
  expect(screen.getByText("Rows handled in the last 12 uploads")).toBeVisible();
});
it("Distinguishes loading from zero observed rows", () => {
  fixture.mockReset().mockReturnValue(new Promise(() => {}));
  const query = queryHarness();
  const view = render(<LargestUploadsCard loading />, { wrapper: query.wrapper });
  expect(screen.getByRole("status", { name: "Loading activity details" })).toBeVisible();
  view.rerender(<LargestUploadsCard uploads={[]} />);
  expect(screen.getByText("No row totals available yet")).toBeVisible();
});
it("Labels the completion arc with real global counts and share", () => {
  render(<CompletionArcCard stats={{ total: 4, completed: 3, inProgress: 1, failed: 0 }} />);
  expect(screen.getByText("75%")).toBeVisible();
  expect(screen.getByText("3 of 4 uploads completed")).toBeVisible();
  expect(screen.getByRole("img", { name: "75 percent of uploads completed" })).toBeVisible();
});
