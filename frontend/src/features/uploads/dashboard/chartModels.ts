import type { Upload, UploadStats } from "@/lib/api/models";

const ROW_FORMAT = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const TIME_FORMAT = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
const SHORT_NAME_LENGTH = 15;
export function formatRows(value: number): string { return ROW_FORMAT.format(value).toLowerCase(); }
function shortFileName(value: string): string {
  const chars = Array.from(value);
  return chars.length <= SHORT_NAME_LENGTH ? value : `${chars.slice(0, SHORT_NAME_LENGTH - 1).join("")}…`;
}

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
  return [...uploads].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)).slice(0, ACTIVITY_LIMIT).reverse().map(upload => {
    const date = new Date(upload.createdAt);
    const time = Number.isFinite(date.getTime()) ? TIME_FORMAT.format(date) : "Time unknown";
    const shortName = shortFileName(upload.fileName);
    return { id: upload.id, fileName: upload.fileName, shortName, date: upload.createdAt, time, label: `${shortName} ${time}`,
      processed: upload.processedRows ?? 0, rejected: upload.failedRows ?? 0,
      reported: upload.processedRows !== null || upload.failedRows !== null,
      rows: (upload.processedRows ?? 0) + (upload.failedRows ?? 0), status: upload.status };
  });
}
export type ActivityPoint = ReturnType<typeof activityPoints>[number];
