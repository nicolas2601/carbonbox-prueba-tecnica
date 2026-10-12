import type { Upload, UploadStats } from "@/lib/api/models";
import { compactNumberFormatter } from "@/lib/format";

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
const SHORT_NAME_LENGTH = 15;
export function formatRows(value: number): string { return compactNumberFormatter.format(value).toLowerCase(); }
function shortFileName(value: string): string {
  const chars = Array.from(value);
  return chars.length <= SHORT_NAME_LENGTH ? value : `${chars.slice(0, SHORT_NAME_LENGTH - 1).join("")}…`;
}

export const ACTIVITY_LIMIT = 12;
export function latestUploads(uploads: readonly Upload[]): Upload[] {
  return [...uploads].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)).slice(0, ACTIVITY_LIMIT);
}
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
  return latestUploads(uploads).reverse().map(upload => {
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
export function activitySummary(points: readonly ActivityPoint[]) {
  const observed = points.filter(point => point.reported);
  const processed = observed.reduce((sum, point) => sum + point.processed, 0);
  const rejected = observed.reduce((sum, point) => sum + point.rejected, 0);
  const total = processed + rejected;
  const largest = [...observed].filter(point => point.rows > 0).sort((a, b) => b.rows - a.rows || a.id.localeCompare(b.id))[0] ?? null;
  const latest = points.at(-1);
  return { processed, rejected, total, reported: observed.length > 0,
    rejectionShare: total > 0 ? rejected / total * 100 : null, largest,
    latestRejectionShare: latest?.reported && latest.rows > 0 ? latest.rejected / latest.rows * 100 : null };
}
