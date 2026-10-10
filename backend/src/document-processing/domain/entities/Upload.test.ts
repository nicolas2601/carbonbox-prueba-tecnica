import { expect, it } from "vitest";
import { Upload, type UploadProps } from "./Upload";
import { FileName } from "../value-objects/FileName";

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
