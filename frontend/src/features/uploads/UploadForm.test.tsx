import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { uploadKeys } from "@/lib/api/uploadKeys";
import type { CreatedUpload } from "@/lib/api/models";
import { queryHarness } from "@/tests/queryHarness";
import { UploadForm } from "./UploadForm";
import { ApiError } from "@/lib/api/ApiError";
import { server } from "@/tests/server";
import { http, HttpResponse } from "msw/http";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const created: CreatedUpload = { id: "new-id", status: "PENDING", fileName: "data.csv", createdAt: "2024-10-12T10:00:00.000Z" };

function mockRecentUploads() {
  server.use(http.get("http://localhost:3001/api/v1/uploads", ({ request }) => {
    const limit = Number(new URL(request.url).searchParams.get("limit"));
    const data = Array.from({ length: limit }, (_, index) => ({
      id: `recent-${index}`, fileName: `recent-${index}.csv`, status: "COMPLETED" as const, createdAt: "2024-10-12T10:00:00.000Z", updatedAt: "2024-10-12T10:00:00.000Z", totalRows: 8, processedRows: 8, failedRows: 0, errorMessage: null,
    }));
    return HttpResponse.json({ data, total: 5, page: 1, limit });
  }));
}

function mockSuccessfulUpload() {
  server.use(http.post("http://localhost:3001/api/v1/uploads", () => HttpResponse.json(created, { status: 201 })));
}

it("shows CSV guidance and only the three latest uploads", async () => {
  mockRecentUploads();
  const harness = queryHarness();
  render(<UploadForm />, { wrapper: harness.wrapper });
  expect(await screen.findByRole("heading", { name: "Before you upload" })).toBeInTheDocument();
  expect(screen.getByText("category, amount, unit, date")).toBeInTheDocument();
  expect(screen.getByText("Amount must be a decimal greater than zero")).toBeInTheDocument();
  expect(screen.getByText("Date must use YYYY-MM-DD")).toBeInTheDocument();
  expect(screen.getByText(`Maximum file size: ${process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? "10"} MB`)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Download sample CSV" })).toHaveAttribute("href", "/sample-activity.csv");
  expect(await screen.findByRole("heading", { name: "Recent uploads" })).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /recent-\d\.csv/ })).toHaveLength(3);
  harness.client.clear();
});

it("Uses uploader progress, disables file controls, finishes and invalidates before redirect", async () => {
  mockRecentUploads(); mockSuccessfulUpload();
  let progress: (percent: number) => void = () => {};
  let resolve: (result: CreatedUpload) => void = () => {};
  const completion = new Promise<CreatedUpload>(done => { resolve = done; });
  const uploader = vi.fn((_file: File, update?: (percent: number) => void) => { progress = update!; return completion; });
  const harness = queryHarness();
  harness.client.setQueryData(uploadKeys.stats(), { total: 0 });
  render(<UploadForm uploader={uploader} />, { wrapper: harness.wrapper });
  const user = userEvent.setup();
  expect(screen.getByRole("button", { name: "Upload file" })).toBeDisabled();
  await user.upload(screen.getByLabelText("Choose a CSV file"), new File(["data"], "data.csv"));
  await user.click(screen.getByRole("button", { name: "Upload file" }));
  await screen.findByRole("progressbar", { name: "Uploading" });
  expect(screen.getByLabelText("Choose a CSV file")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Remove file" })).toBeDisabled();
  act(() => progress(40));
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
  expect(screen.getByText("40%", { exact: true })).toBeInTheDocument();
  act(() => progress(100));
  expect(screen.getByRole("progressbar", { name: "Finishing" })).toHaveAttribute("aria-valuenow", "100");
  resolve(created);
  await waitFor(() => expect(push).toHaveBeenLastCalledWith("/uploads/new-id"));
  expect(harness.client.getQueryState(uploadKeys.stats())?.isInvalidated).toBe(true);
  expect(uploader).toHaveBeenCalledOnce();
  harness.client.clear();
});
it("Aborts a transfer, keeps selection and ignores late progress or responses", async () => {
  mockRecentUploads();
  push.mockClear();
  let signal: AbortSignal | undefined;
  let progress: (percent: number) => void = () => {};
  let resolve: (value: CreatedUpload) => void = () => {};
  const pending = new Promise<CreatedUpload>(done => { resolve = done; });
  const uploader = vi.fn((_file: File, update?: (percent: number) => void, abort?: AbortSignal) => {
    signal = abort; progress = update!; return pending;
  });
  render(<UploadForm uploader={uploader} />, { wrapper: queryHarness().wrapper });
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText("Choose a CSV file"), new File(["data"], "data.csv"));
  await user.click(screen.getByRole("button", { name: "Upload file" }));
  await screen.findByRole("progressbar");
  act(() => progress(35));
  await user.click(screen.getByRole("button", { name: "Cancel upload" }));
  expect(signal?.aborted).toBe(true);
  expect(screen.getByText("data.csv")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Upload file" })).toBeEnabled();
  act(() => progress(90)); resolve(created);
  await act(async () => { await pending; });
  expect(push).not.toHaveBeenCalled();
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it("Prevents cancel once bytes are sent and aborts on navigation away", async () => {
  mockRecentUploads();
  let signal: AbortSignal | undefined;
  let progress: (percent: number) => void = () => {};
  const uploader = (_file: File, update?: (percent: number) => void, abort?: AbortSignal) => {
    signal = abort; progress = update!;
    return new Promise<CreatedUpload>((_resolve, reject) => abort?.addEventListener("abort", () => reject(new ApiError("CANCELLED", "Canceled", 0))));
  };
  const view = render(<UploadForm uploader={uploader} />, { wrapper: queryHarness().wrapper });
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText("Choose a CSV file"), new File(["data"], "data.csv"));
  await user.click(screen.getByRole("button", { name: "Upload file" }));
  await screen.findByRole("progressbar");
  act(() => progress(100));
  expect(screen.getByRole("button", { name: "Cancel upload" })).toBeDisabled();
  view.unmount();
  expect(signal?.aborted).toBe(true);
});
it.each([400, 413, 500, 0])("Keeps the file and recovers upload failure %s", async status => {
  mockRecentUploads();
  const error = new ApiError(status ? "FAILED" : "NETWORK_ERROR", status === 413 ? "File exceeds server limit" : "Cannot finish upload", status, status === 500 ? "req-upload" : undefined);
  const uploader = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(created);
  render(<UploadForm uploader={uploader} />, { wrapper: queryHarness().wrapper });
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText("Choose a CSV file"), new File(["data"], "data.csv"));
  await user.click(screen.getByRole("button", { name: "Upload file" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(error.message);
  expect(screen.getByText("data.csv")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Upload file" })).toBeEnabled();
  if (status === 500) expect(screen.getByText("Request req-upload")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(uploader).toHaveBeenCalledTimes(2));
});
