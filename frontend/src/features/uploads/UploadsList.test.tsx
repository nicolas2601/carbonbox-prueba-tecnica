import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { expect, it, vi } from "vitest";
import { queryHarness } from "@/tests/queryHarness";
import { API_URL, server } from "@/tests/server";
import { page, upload } from "@/tests/fixtures";
import { UploadsList } from "./UploadsList";

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));

it("Filters on the server and preserves q/status/sort when changing pages", async () => {
  const filters = { q: "fuel", status: "COMPLETED", sort: "name" };
  server.use(http.get(`${API_URL}/uploads`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    expect(params.get("q")).toBe("fuel"); expect(params.get("status")).toBe("COMPLETED");
    expect(params.get("sort")).toBe("name");
    return HttpResponse.json(page([upload("fuel")], 25, 2));
  }));
  render(<UploadsList page={2} filters={filters} />, { wrapper: queryHarness().wrapper });
  expect(await screen.findByRole("table", { name: "Matching uploads" })).toBeInTheDocument();
  expect(screen.getByRole("searchbox", { name: "Search filenames" })).toHaveValue("fuel");
  await userEvent.setup().click(screen.getByRole("button", { name: "Next" }));
  expect(push).toHaveBeenLastCalledWith("/uploads?page=3&q=fuel&status=COMPLETED&sort=name", { scroll: false });
});
it("Explains a genuinely empty match and clears the filters instead of claiming no upload history", async () => {
  server.use(http.get(`${API_URL}/uploads`, () => HttpResponse.json(page([]))));
  render(<UploadsList page={1} filters={{ q: "missing", status: "FAILED" }} />, { wrapper: queryHarness().wrapper });
  expect(await screen.findByRole("heading", { name: "No matching uploads" })).toBeInTheDocument();
  expect(screen.getByText(/missing/)).toBeInTheDocument();
  expect(screen.queryByText("No uploads yet")).toBeNull();
  await userEvent.setup().click(screen.getByRole("button", { name: "Show all uploads" }));
  expect(replace).toHaveBeenLastCalledWith("/uploads?page=1", { scroll: false });
});
it("Reflects URL-driven back/navigation changes in the search input", async () => {
  server.use(http.get(`${API_URL}/uploads`, () => HttpResponse.json(page([upload()]))));
  const view = render(<UploadsList page={1} filters={{ q: "fuel" }} />, { wrapper: queryHarness().wrapper });
  await screen.findByRole("searchbox");
  view.rerender(<UploadsList page={1} filters={{ q: "water" }} />);
  expect(screen.getByRole("searchbox")).toHaveValue("water");
});

it("Shows five scoped headers, all statuses, grouped counters and detail actions", async () => {
  const items = [upload("pending", "PENDING"), upload("processing", "PROCESSING"), upload("completed"), upload("failed", "FAILED")];
  items[0].processedRows = null; items[1].processedRows = 5000; items[3].processedRows = 0;
  server.use(http.get(`${API_URL}/uploads`, ({ request }) => {
    expect(new URL(request.url).searchParams.get("limit")).toBe("10");
    return HttpResponse.json(page(items));
  }));
  render(<UploadsList page={1} />, { wrapper: queryHarness().wrapper });
  const table = await screen.findByRole("table", { name: "All uploads" });
  const headers = within(table).getAllByRole("columnheader");
  expect(headers.map(header => header.textContent)).toEqual(["File name", "Status", "Upload date", "Processed rows", "Actions"]);
  for (const header of headers) expect(header).toHaveAttribute("scope", "col");
  for (const status of ["Pending", "Processing", "Completed", "Failed"]) expect(within(table).getByText(status)).toBeInTheDocument();
  expect(within(table).getByText("Not yet")).toBeInTheDocument();
  expect(within(table).getByText("5,000")).toBeInTheDocument();
  expect(within(table).getByText("0")).toBeInTheDocument();
  expect(within(table).getByRole("link", { name: "View completed.csv" })).toHaveAttribute("href", "/uploads/completed");
});
it("Has a loading shape and one actionable empty state", async () => {
  server.use(http.get(`${API_URL}/uploads`, () => HttpResponse.json(page([]))));
  render(<UploadsList page={1} />, { wrapper: queryHarness().wrapper });
  expect(screen.getByRole("status", { name: "Loading uploads" })).toBeInTheDocument();
  expect(await screen.findByText("No uploads yet")).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: "Upload a file" })).toHaveLength(2);
});
it("Recovers a failed list request with retry", async () => {
  let calls = 0;
  server.use(http.get(`${API_URL}/uploads`, () => ++calls === 1
    ? HttpResponse.json({ error: { code: "FAILED", message: "List unavailable" } }, { status: 500 })
    : HttpResponse.json(page([upload()]))));
  render(<UploadsList page={1} />, { wrapper: queryHarness().wrapper });
  expect(await screen.findByRole("alert")).toHaveTextContent("List unavailable");
  await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByRole("table", { name: "All uploads" });
  expect(calls).toBe(2);
});
it("Moves the page into the URL and retains rows during the next request", async () => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  server.use(http.get(`${API_URL}/uploads`, async ({ request }) => {
    const current = Number(new URL(request.url).searchParams.get("page"));
    if (current === 2) await gate;
    return HttpResponse.json(page([upload(`page-${current}`)], 11, current));
  }));
  const view = render(<UploadsList page={1} />, { wrapper: queryHarness().wrapper });
  await screen.findByRole("link", { name: "page-1.csv" });
  await userEvent.setup().click(screen.getByRole("button", { name: "Next" }));
  expect(push).toHaveBeenLastCalledWith("/uploads?page=2", { scroll: false });
  view.rerender(<UploadsList page={2} />);
  expect(screen.getByRole("link", { name: "page-1.csv" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  expect(screen.queryByRole("status", { name: "Loading uploads" })).not.toBeInTheDocument();
  release();
  await screen.findByRole("link", { name: "page-2.csv" });
  expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
});
