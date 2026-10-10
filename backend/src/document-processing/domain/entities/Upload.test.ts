import { expect, it } from "vitest";
import { Upload, type UploadProps } from "./Upload";
import { FileName } from "../value-objects/FileName";
import { InvalidStatusTransitionError } from "../errors/InvalidStatusTransitionError";
import { InvalidProgressError } from "../errors/InvalidProgressError";

const createdAt = new Date("2024-01-15T00:00:00Z");
const now = new Date("2024-01-16T00:00:00Z");
function fileName(): FileName {
  const result = FileName.create("report.csv");
  if (result.isLeft()) throw result.value;
  return result.value;
}
function pending(): Upload {
  return Upload.create({ id: "u", fileName: fileName(), fileUrl: "key.csv", userId: "user", now: createdAt });
}
function snapshot(upload: Upload): UploadProps {
  return { id: upload.id, fileName: upload.fileName, fileUrl: upload.fileUrl, userId: upload.userId,
    status: upload.status, totalRows: upload.totalRows, processedRows: upload.processedRows,
    failedRows: upload.failedRows, errorMessage: upload.errorMessage, createdAt: upload.createdAt, updatedAt: upload.updatedAt };
}

it("Creating an upload", () => {
  expect(snapshot(pending())).toEqual({ id: "u", fileName: fileName(), fileUrl: "key.csv", userId: "user",
    status: "PENDING", totalRows: null, processedRows: null, failedRows: null, errorMessage: null,
    createdAt, updatedAt: createdAt });
});
it.each(["COMPLETED", "FAILED"] as const)("Rebuilding a stored upload: %s", status => {
  const props = { ...snapshot(pending()), status, totalRows: 10, processedRows: 8, failedRows: 2,
    errorMessage: "2 rejected", updatedAt: now };
  expect(snapshot(Upload.reconstitute(props))).toEqual(props);
});

it("Starting a pending upload", () => {
  const upload = pending();
  expect(upload.startProcessing(now).isRight()).toBe(true);
  expect(upload.status).toBe("PROCESSING");
  expect(upload.updatedAt).toEqual(now);
});
it("Starting again after a retry", () => {
  const upload = Upload.reconstitute({ ...snapshot(pending()), status: "PROCESSING",
    processedRows: 8, failedRows: 2, totalRows: 10, errorMessage: "old attempt" });
  expect(upload.startProcessing(now).isRight()).toBe(true);
  expect(upload.status).toBe("PROCESSING");
  expect(upload.processedRows).toBe(0);
  expect(upload.failedRows).toBe(0);
  expect(upload.totalRows).toBe(0);
  expect(upload.errorMessage).toBeNull();
});

it.each([{ processedRows: 500, failedRows: 3 }, { processedRows: 12, failedRows: 0 }])("Recording progress: %j", progress => {
  const upload = pending();
  upload.startProcessing(createdAt);
  expect(upload.recordProgress(progress, now).isRight()).toBe(true);
  expect(upload.processedRows).toBe(progress.processedRows);
  expect(upload.failedRows).toBe(progress.failedRows);
  expect(upload.updatedAt).toEqual(now);
});
it("Progress outside processing is rejected", () => {
  const upload = pending();
  const before = snapshot(upload);
  expect(upload.recordProgress({ processedRows: 1, failedRows: 0 }, now).value).toBeInstanceOf(InvalidStatusTransitionError);
  expect(snapshot(upload)).toEqual(before);
});

it.each([{ totalRows: 10, processedRows: 8, failedRows: 2 }, { totalRows: 3, processedRows: 3, failedRows: 0 }])("Completing with consistent numbers: %j", counters => {
  const upload = pending();
  upload.startProcessing(createdAt);
  expect(upload.complete(counters, now).isRight()).toBe(true);
  expect(upload.status).toBe("COMPLETED");
  expect(snapshot(upload)).toMatchObject({ ...counters, updatedAt: now });
});
it("A pending upload cannot complete", () => {
  const upload = pending();
  const before = snapshot(upload);
  expect(upload.complete({ totalRows: 1, processedRows: 1, failedRows: 0 }, now).value).toBeInstanceOf(InvalidStatusTransitionError);
  expect(snapshot(upload)).toEqual(before);
});
it.each([{ totalRows: 10, processedRows: 8, failedRows: 3 }, { totalRows: -1, processedRows: -1, failedRows: 0 },
  { totalRows: 1.5, processedRows: 1.5, failedRows: 0 }, { totalRows: Infinity, processedRows: Infinity, failedRows: 0 }])("Completing with invalid numbers: %j", counters => {
  const upload = pending();
  upload.startProcessing(createdAt);
  const before = snapshot(upload);
  expect(upload.complete(counters, now).value).toBeInstanceOf(InvalidProgressError);
  expect(snapshot(upload)).toEqual(before);
});
it.each([{ processedRows: -1, failedRows: 0 }, { processedRows: 0, failedRows: 1.5 },
  { processedRows: NaN, failedRows: 0 }, { processedRows: 0, failedRows: Infinity }])("Invalid counters rejected: %j", progress => {
  const upload = pending();
  upload.startProcessing(createdAt);
  const before = snapshot(upload);
  expect(upload.recordProgress(progress, now).value).toBeInstanceOf(InvalidProgressError);
  expect(snapshot(upload)).toEqual(before);
});
