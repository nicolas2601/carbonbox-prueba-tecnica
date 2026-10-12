import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { expect, it, vi } from "vitest";
import { API_URL, server } from "@/tests/server";
import { queryHarness } from "@/tests/queryHarness";
import { page, upload } from "@/tests/fixtures";
import { FinishedPanel } from "./FinishedPanel";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
it("Shows completion counts and 25 precise rows with original calendar dates", async () => {
  const rows = Array.from({ length: 25 }, (_, index) => ({ category: `Category ${index}`, amount: 1.23456789, unit: "m3", date: "2024-01-15" }));
  server.use(http.get(`${API_URL}/uploads/u1/results`, ({ request }) => {
    expect(new URL(request.url).searchParams.get("limit")).toBe("25");
    return HttpResponse.json(page(rows, 60, 1, 25));
  }));
  render(<FinishedPanel upload={upload()} page={1} />, { wrapper: queryHarness().wrapper });
  const table = await screen.findByRole("table", { name: "Processed rows" });
  expect(within(table).getAllByRole("row")).toHaveLength(26);
  expect(within(table).getAllByText("1.23456789")[0]).toHaveClass("text-right", "tabular-nums");
  expect(within(table).getAllByText("2024-01-15")).toHaveLength(25);
  expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
  expect(screen.getByRole("article", { name: "Processed rows" })).toHaveTextContent("60");
});
it("Keeps result rows during pagination and puts the target page in the URL", async () => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  server.use(http.get(`${API_URL}/uploads/u1/results`, async ({ request }) => {
    const current = Number(new URL(request.url).searchParams.get("page"));
    if (current === 2) await gate;
    return HttpResponse.json(page([{ category: `Row ${current}`, amount: 4, unit: "kg", date: "2024-01-15" }], 60, current, 25));
  }));
  const view = render(<FinishedPanel upload={upload()} page={1} />, { wrapper: queryHarness().wrapper });
  await screen.findByText("Row 1");
  await userEvent.setup().click(screen.getByRole("button", { name: "Next" }));
  expect(push).toHaveBeenLastCalledWith("/uploads/u1?page=2", { scroll: false });
  view.rerender(<FinishedPanel upload={upload()} page={2} />);
  expect(screen.getByText("Row 1")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  release();
  await screen.findByText("Row 2");
});
it("Explains rejected rows beside the retained valid results", async () => {
  server.use(http.get(`${API_URL}/uploads/u1/results`, () => HttpResponse.json(page([], 15, 1, 25))));
  render(<FinishedPanel upload={{ ...upload(), processedRows: 15, failedRows: 10, totalRows: 25,
    errorMessage: "10 rows rejected. line 3: amount - Must be positive; line 5: date - Invalid date" }} page={1} />, { wrapper: queryHarness().wrapper });
  expect(screen.getByRole("note", { name: "Rejected rows" })).toHaveTextContent("Valid rows were kept");
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  await screen.findByRole("table", { name: "Processed rows" });
});
