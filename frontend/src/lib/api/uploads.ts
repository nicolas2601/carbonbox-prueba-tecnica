import { api } from "./client";
import type { CreatedUpload, Page, ResultRow, Upload, UploadStats } from "./models";

export async function getStats(): Promise<UploadStats> {
  return (await api.get<UploadStats>("/uploads/stats")).data;
}
export async function listUploads(page: number, limit: number): Promise<Page<Upload>> {
  return (await api.get<Page<Upload>>("/uploads", { params: { page, limit } })).data;
}
export async function getUpload(id: string): Promise<Upload> {
  return (await api.get<Upload>(`/uploads/${encodeURIComponent(id)}`)).data;
}
export async function getUploadResults(id: string, page: number, limit: number): Promise<Page<ResultRow>> {
  return (await api.get<Page<ResultRow>>(`/uploads/${encodeURIComponent(id)}/results`, { params: { page, limit } })).data;
}
export function uploadPercent(loaded: number, total?: number): number | undefined {
  if (!total || !Number.isFinite(total) || total < 0 || !Number.isFinite(loaded)) return undefined;
  return Math.min(100, Math.max(0, Math.round(loaded / total * 100)));
}
export async function createUpload(file: File, onProgress?: (percent: number) => void): Promise<CreatedUpload> {
  const body = new FormData();
  body.append("file", file);
  onProgress?.(0);
  const response = await api.post<CreatedUpload>("/uploads", body, { onUploadProgress: event => {
    const percent = uploadPercent(event.loaded, event.total);
    if (percent !== undefined) onProgress?.(percent);
  } });
  onProgress?.(100);
  return response.data;
}
