import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { page, upload } from "@/tests/fixtures";
const { charts, listUploads } = vi.hoisted(() => ({
  charts: { ActivityChart: vi.fn(() => null), LargestUploadsChart: vi.fn(() => null) },
  listUploads: vi.fn(),
}));
vi.mock("./LazyCharts", () => charts);
vi.mock("@/lib/api/uploads", () => ({ listUploads, getStats: vi.fn(), getUpload: vi.fn(), getUploadResults: vi.fn(), createUpload: vi.fn() }));

import { queryHarness } from "@/tests/queryHarness";
import { ActivityCard } from "./ActivityCard";

function uploadsFixture(count: number) {
  return Array.from({ length: count }, (_, index) => ({ ...upload(String(index)), processedRows: 10 + index, failedRows: 1 }));
}
function renderActivity(count: number) {
  listUploads.mockResolvedValue(page(uploadsFixture(count)));
  const query = queryHarness();
  return render(<ActivityCard />, { wrapper: query.wrapper });
}

beforeEach(() => vi.clearAllMocks());

it.each([1, 3, 6])("Renders the horizontal LargestUploadsChart for %s uploads", async count => {
  renderActivity(count);
  const plot = await screen.findByRole("img", { name: `Processed and rejected rows in the last 12 uploads, ${count} files. Values are in the following table.` });
  expect(plot).toHaveAttribute("data-orientation", "horizontal");
  expect(charts.LargestUploadsChart).toHaveBeenCalledWith(expect.objectContaining({ orientation: "horizontal" }), undefined);
  expect(charts.ActivityChart).not.toHaveBeenCalled();
});

it("Renders the vertical ActivityChart for more than six uploads", async () => {
  renderActivity(7);
  const plot = await screen.findByRole("img", { name: /7 files/ });
  expect(plot).toHaveAttribute("data-orientation", "vertical");
  expect(charts.ActivityChart).toHaveBeenCalledWith(expect.objectContaining({ points: expect.arrayContaining([expect.objectContaining({ fileName: "0.csv" })]) }), undefined);
  expect(charts.LargestUploadsChart).not.toHaveBeenCalled();
});

it("Keeps the screen-reader table with one row per uploaded file", async () => {
  renderActivity(2);
  await screen.findByRole("img", { name: /2 files/ });
  expect(screen.getByRole("table", { name: "Rows in the last 12 uploads" }).querySelectorAll("tbody tr")).toHaveLength(2);
});
