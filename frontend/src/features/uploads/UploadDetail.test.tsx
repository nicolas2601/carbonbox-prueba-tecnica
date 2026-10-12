import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { expect, it, vi } from "vitest";
import { API_URL, server } from "@/tests/server";
import { queryHarness } from "@/tests/queryHarness";
import { upload } from "@/tests/fixtures";
import { UploadDetail } from "./UploadDetail";
import { page as resultPage } from "@/tests/fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

it("Displays file information and a back link from the public DTO", async () => {
  server.use(http.get(`${API_URL}/uploads/u1`, () => HttpResponse.json(upload("u1", "PENDING"))));
  render(<UploadDetail id="u1" page={1} />, { wrapper: queryHarness().wrapper });
  expect(await screen.findByRole("heading", { name: "u1.csv", level: 1 })).toBeInTheDocument();
  expect(screen.getByText("Pending")).toBeInTheDocument();
  expect(screen.getByText("Oct 12, 2024")).toBeInTheDocument();
  expect(screen.getByText("u1", { exact: true })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to uploads" })).toHaveAttribute("href", "/uploads");
});
it("Explains an unknown upload without starting status polling", async () => {
  let calls = 0;
  server.use(http.get(`${API_URL}/uploads/missing`, () => { calls++; return HttpResponse.json({ error: { code: "UPLOAD_NOT_FOUND", message: "Upload not found" } }, { status: 404 }); }));
  render(<UploadDetail id="missing" page={1} />, { wrapper: queryHarness().wrapper });
  expect(await screen.findByRole("heading", { name: "Upload not found" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to uploads" })).toHaveAttribute("href", "/uploads");
  expect(calls).toBe(1);
});
it("Recovers unexpected detail errors through the retry action", async () => {
  let calls = 0;
  server.use(http.get(`${API_URL}/uploads/u1`, () => ++calls === 1
    ? HttpResponse.json({ error: { code: "FAILED", message: "Try loading again", requestId: "req-detail" } }, { status: 500 })
    : HttpResponse.json(upload("u1", "PENDING"))));
  render(<UploadDetail id="u1" page={1} />, { wrapper: queryHarness().wrapper });
  expect(await screen.findByRole("alert")).toHaveTextContent("req-detail");
  await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("heading", { name: "u1.csv" })).toBeInTheDocument();
  expect(calls).toBe(2);
});
it("Shows queued work without an invented percentage", async () => {
  server.use(http.get(`${API_URL}/uploads/u1`, () => HttpResponse.json(upload("u1", "PENDING"))));
  render(<UploadDetail id="u1" page={1} />, { wrapper: queryHarness().wrapper });
  expect(await screen.findByRole("heading", { name: "Waiting for a worker" })).toBeInTheDocument();
  const progress = screen.getByRole("progressbar");
  expect(progress).not.toHaveAttribute("aria-valuenow");
  expect(progress).not.toHaveAttribute("aria-valuemax");
});
it("Combines valid and rejected rows into an honest processing counter", async () => {
  server.use(http.get(`${API_URL}/uploads/u1`, () => HttpResponse.json({ ...upload("u1", "PROCESSING"), processedRows: 1500, failedRows: 12, totalRows: null })));
  render(<UploadDetail id="u1" page={1} />, { wrapper: queryHarness().wrapper });
  expect(await screen.findByText("1,512 rows handled")).toBeInTheDocument();
  expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
  expect(screen.queryByText(/%/)).not.toBeInTheDocument();
});
it("Announces one status transition and stops requests after completion", async () => {
  vi.useFakeTimers();
  let calls = 0;
  server.use(http.get(`${API_URL}/uploads/u1`, () => HttpResponse.json(upload("u1", ++calls === 1 ? "PROCESSING" : "COMPLETED"))),
    http.get(`${API_URL}/uploads/u1/results`, () => HttpResponse.json(resultPage([], 0, 1, 25))));
  const view = render(<UploadDetail id="u1" page={1} />, { wrapper: queryHarness().wrapper });
  await vi.waitFor(() => expect(screen.getByRole("status", { name: "Upload status" })).toHaveTextContent("Upload processing"));
  const announcements: string[] = [];
  const observer = new MutationObserver(() => { announcements.push(screen.getByRole("status", { name: "Upload status" }).textContent!); });
  observer.observe(screen.getByRole("status", { name: "Upload status" }), { childList: true, characterData: true, subtree: true });
  await act(() => vi.advanceTimersByTimeAsync(3000));
  await vi.waitFor(() => expect(screen.getByRole("status", { name: "Upload status" })).toHaveTextContent("Upload completed"));
  await act(() => vi.advanceTimersByTimeAsync(9000));
  expect(announcements).toEqual(["Upload completed"]);
  expect(calls).toBe(2);
  observer.disconnect(); view.unmount();
});
it("Connects completed detail to the first 25 processed rows", async () => {
  server.use(http.get(`${API_URL}/uploads/u1`, () => HttpResponse.json(upload())),
    http.get(`${API_URL}/uploads/u1/results`, () => HttpResponse.json(resultPage(Array.from({ length: 25 }, () => ({ category: "Water", amount: 4, unit: "m3", date: "2024-01-15" })), 60, 1, 25))));
  render(<UploadDetail id="u1" page={1} />, { wrapper: queryHarness().wrapper });
  expect(await screen.findByRole("table", { name: "Processed rows" })).toBeInTheDocument();
  expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
});
it("Shows a terminal failure reason without requesting results", async () => {
  server.use(http.get(`${API_URL}/uploads/u1`, () => HttpResponse.json({ ...upload("u1", "FAILED"), errorMessage: "Missing required column: unit" })));
  render(<UploadDetail id="u1" page={1} />, { wrapper: queryHarness().wrapper });
  expect(await screen.findByText("Missing required column: unit")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Upload another file" })).toHaveAttribute("href", "/uploads/new");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
