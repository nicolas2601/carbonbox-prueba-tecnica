import type { Page, Upload, UploadStats, UploadStatus } from "@/lib/api/models";

export const UPLOAD_POLL_MS = 3000;
export const STATS_POLL_MS = 5000;

export function uploadInterval(status: UploadStatus | undefined): number | false {
  return status === "PENDING" || status === "PROCESSING" ? UPLOAD_POLL_MS : false;
}
export function statsInterval(stats: UploadStats | undefined): number | false {
  return stats && stats.inProgress > 0 ? STATS_POLL_MS : false;
}
export function listInterval(page: Page<Upload> | undefined): number | false {
  return page?.data.some(item => uploadInterval(item.status)) ? UPLOAD_POLL_MS : false;
}
