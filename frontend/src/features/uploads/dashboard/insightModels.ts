import type { Upload, UploadStats } from "@/lib/api/models";
import { activityPoints, latestUploads } from "./chartModels";

const TOP_UPLOADS_LIMIT = 5;
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const NUMBER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
export function rowQuality(stats: UploadStats) {
  const processed = stats.processedRows;
  const rejected = stats.rejectedRows;
  if (processed === undefined || rejected === undefined || !Number.isSafeInteger(processed) || !Number.isSafeInteger(rejected) || processed < 0 || rejected < 0) return null;
  const total = processed + rejected;
  return { processed, rejected, total, rejectionShare: total === 0 ? null : rejected / total * 100 };
}
export function elapsedSamples(uploads: readonly Upload[]) {
  const recent = latestUploads(uploads);
  return activityPoints(recent).flatMap(point => {
    const upload = recent.find(item => item.id === point.id);
    if (!upload || (upload.status !== "COMPLETED" && upload.status !== "FAILED")) return [];
    const elapsedMs = Date.parse(upload.updatedAt) - Date.parse(upload.createdAt);
    return Number.isFinite(elapsedMs) && elapsedMs >= 0 ? [{ ...point, elapsedMs }] : [];
  });
}
export function medianElapsed(uploads: readonly Upload[]): number | null {
  const values = elapsedSamples(uploads).map(item => item.elapsedMs).sort((a, b) => a - b);
  if (values.length === 0) return null;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle]! : (values[middle - 1]! + values[middle]!) / 2;
}
export function largestUploads(uploads: readonly Upload[]) {
  return activityPoints(uploads).filter(point => point.reported && point.rows > 0)
    .sort((a, b) => b.rows - a.rows || a.id.localeCompare(b.id)).slice(0, TOP_UPLOADS_LIMIT);
}
export function formatElapsed(milliseconds: number): string {
  if (milliseconds === 0) return "<1 ms";
  if (milliseconds < SECOND_MS) return `${NUMBER.format(milliseconds)} ms`;
  if (milliseconds < MINUTE_MS) return `${NUMBER.format(milliseconds / SECOND_MS)} s`;
  if (milliseconds < HOUR_MS) return `${NUMBER.format(milliseconds / MINUTE_MS)} min`;
  return `${NUMBER.format(milliseconds / HOUR_MS)} h`;
}
