import type { Upload, UploadStats } from "@/lib/api/models";
import { dateFormatter } from "@/lib/format";

export const ACTIVITY_LIMIT = 12;
export function completionShare(stats: UploadStats): number {
  return stats.total === 0 ? 0 : Math.round(stats.completed / stats.total * 100);
}
export function statusCounts(stats: UploadStats) {
  return [
    { label: "Completed", count: stats.completed, fill: "var(--completed)" },
    { label: "In progress", count: stats.inProgress, fill: "var(--processing)" },
    { label: "Failed", count: stats.failed, fill: "var(--failed)" },
  ];
}
export function activityPoints(uploads: readonly Upload[]) {
  return [...uploads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, ACTIVITY_LIMIT).reverse().map(upload => ({
    id: upload.id, fileName: upload.fileName, date: upload.createdAt, label: dateFormatter.format(new Date(upload.createdAt)),
    rows: (upload.processedRows ?? 0) + (upload.failedRows ?? 0), status: upload.status,
  }));
}
export type ActivityPoint = ReturnType<typeof activityPoints>[number];
