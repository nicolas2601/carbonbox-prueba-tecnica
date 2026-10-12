import type { IUploadQueries } from "../../ports/IUploadQueries";
import type { Page, Pagination, ResultRow, UploadListQuery, UploadView, UploadStats } from "../models";
import { pageOffset } from "../validatePagination";

export function view(id: string, status = "PENDING"): UploadView {
  return { id, fileName: `${id}.csv`, status, totalRows: null, processedRows: null, failedRows: null,
    errorMessage: null, createdAt: "2024-01-15T00:00:00.000Z", updatedAt: "2024-01-15T00:00:00.000Z" };
}
export class MemoryUploadQueries implements IUploadQueries {
  readonly uploads: UploadView[] = [];
  readonly rows = new Map<string, ResultRow[]>();
  async findById(id: string): Promise<UploadView | null> { return this.uploads.find(upload => upload.id === id) ?? null; }
  async list(query: UploadListQuery): Promise<Page<UploadView>> {
    const data = this.uploads.filter(upload => (!query.q || upload.fileName.toLocaleLowerCase().includes(query.q.toLocaleLowerCase()))
      && (!query.status || upload.status === query.status));
    data.sort((a, b) => {
      if (query.sort === "name") return a.fileName.localeCompare(b.fileName) || a.id.localeCompare(b.id);
      const byCreatedAt = a.createdAt.localeCompare(b.createdAt);
      if (byCreatedAt !== 0) return query.sort === "oldest" ? byCreatedAt : -byCreatedAt;
      return a.id.localeCompare(b.id);
    });
    return this.page(data, { page: query.page, limit: query.limit });
  }
  async results(uploadId: string, pagination: Pagination): Promise<Page<ResultRow>> {
    const data = [...(this.rows.get(uploadId) ?? [])].sort((a, b) => a.date.localeCompare(b.date));
    return this.page(data, pagination);
  }
  async stats(): Promise<UploadStats> {
    return { total: this.uploads.length, completed: this.uploads.filter(row => row.status === "COMPLETED").length,
      failed: this.uploads.filter(row => row.status === "FAILED").length,
      inProgress: this.uploads.filter(row => row.status === "PENDING" || row.status === "PROCESSING").length };
  }
  private page<T>(data: T[], pagination: Pagination): Page<T> {
    const offset = pageOffset(pagination);
    return { data: data.slice(offset, offset + pagination.limit), total: data.length, ...pagination };
  }
}
