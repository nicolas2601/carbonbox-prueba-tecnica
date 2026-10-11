import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { beforeEach, expect, it } from "vitest";
import { queryHarness } from "@/tests/queryHarness";
import { API_URL, server } from "@/tests/server";
import { page, upload } from "@/tests/fixtures";
import { Dashboard } from "./Dashboard";

const totals = { total: 7, completed: 3, inProgress: 3, failed: 1 };
beforeEach(() => server.use(
  http.get(`${API_URL}/uploads/stats`, () => HttpResponse.json(totals)),
  http.get(`${API_URL}/uploads`, () => HttpResponse.json(page([]))),
));
it("Shows real totals and the primary creation link", async () => {
  render(<Dashboard />, { wrapper: queryHarness().wrapper });
  for (const [label, count] of [["Total uploads", "7"], ["Completed", "3"], ["In progress", "3"], ["Failed", "1"]]) {
    expect(within(await screen.findByRole("article", { name: label })).getByText(count)).toBeInTheDocument();
  }
  expect(screen.getAllByRole("link", { name: "Upload a file" })[0]).toHaveAttribute("href", "/uploads/new");
});
it("Shows structural loading without fabricated figures", async () => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  server.use(http.get(`${API_URL}/uploads/stats`, async () => { await gate; return HttpResponse.json(totals); }));
  render(<Dashboard />, { wrapper: queryHarness().wrapper });
  expect(screen.getByRole("status", { name: "Loading totals" })).toBeInTheDocument();
  expect(screen.queryByRole("article", { name: "Total uploads" })).not.toBeInTheDocument();
  release();
  await screen.findByRole("article", { name: "Total uploads" });
});
it("Retries a failed stats request with the same API contract", async () => {
  let calls = 0;
  server.use(http.get(`${API_URL}/uploads/stats`, () => ++calls === 1
    ? HttpResponse.json({ error: { code: "INTERNAL_ERROR", message: "Please try again", requestId: "req-dashboard" } }, { status: 500 })
    : HttpResponse.json(totals)));
  render(<Dashboard />, { wrapper: queryHarness().wrapper });
  expect(await screen.findByRole("alert")).toHaveTextContent("req-dashboard");
  await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByRole("article", { name: "Total uploads" });
  expect(calls).toBe(2);
});
it("Shows at most five recent files with dates, status and detail links", async () => {
  server.use(http.get(`${API_URL}/uploads`, ({ request }) => {
    expect(new URL(request.url).searchParams.get("limit")).toBe("5");
    return HttpResponse.json(page(Array.from({ length: 7 }, (_, index) => upload(`recent-${index}`)), 7, 1, 5));
  }));
  render(<Dashboard />, { wrapper: queryHarness().wrapper });
  const table = await screen.findByRole("table", { name: "Recent uploads" });
  expect(within(table).getAllByRole("row")).toHaveLength(6);
  expect(within(table).getByRole("link", { name: "recent-0.csv" })).toHaveAttribute("href", "/uploads/recent-0");
  expect(within(table).getAllByText("Oct 12, 2024")).toHaveLength(5);
  expect(screen.getByRole("link", { name: "View all uploads" })).toHaveAttribute("href", "/uploads");
});
it("Invites the first file and recovers recent-list errors independently", async () => {
  let calls = 0;
  server.use(http.get(`${API_URL}/uploads`, () => ++calls === 1
    ? HttpResponse.json({ error: { code: "FAILED", message: "Recent uploads unavailable" } }, { status: 500 })
    : HttpResponse.json(page([]))));
  render(<Dashboard />, { wrapper: queryHarness().wrapper });
  expect(await screen.findByRole("alert")).toHaveTextContent("Recent uploads unavailable");
  await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("No uploads yet")).toBeInTheDocument();
  expect(calls).toBe(2);
});
