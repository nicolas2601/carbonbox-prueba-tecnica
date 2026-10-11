import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { beforeEach, expect, it } from "vitest";
import { queryHarness } from "@/tests/queryHarness";
import { API_URL, server } from "@/tests/server";
import { page } from "@/tests/fixtures";
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
