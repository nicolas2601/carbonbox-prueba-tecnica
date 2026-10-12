import type { Page, Upload, UploadStatus } from "@/lib/api/models";

export function upload(id = "u1", status: UploadStatus = "COMPLETED"): Upload {
  return { id, fileName: `${id}.csv`, status, totalRows: 60, processedRows: 60, failedRows: 0,
    errorMessage: null, createdAt: "2024-10-12T10:00:00.000Z", updatedAt: "2024-10-12T10:00:01.000Z" };
}
export function page<T>(data: T[], total = data.length, current = 1, limit = 10): Page<T> {
  return { data, total, page: current, limit };
}
