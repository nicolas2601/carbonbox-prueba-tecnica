import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { uploadKeys } from "@/lib/api/uploadKeys";
import type { CreatedUpload } from "@/lib/api/models";
import { queryHarness } from "@/tests/queryHarness";
import { UploadForm } from "./UploadForm";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const created: CreatedUpload = { id: "new-id", status: "PENDING", fileName: "data.csv", createdAt: "2024-10-12T10:00:00.000Z" };

it("Uses uploader progress, disables file controls, finishes and invalidates before redirect", async () => {
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
