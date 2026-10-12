export interface Pagination { page: number; limit: number; }
export interface PaginationRequest { page?: number; limit?: number; }
export type UploadStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type UploadSort = "newest" | "oldest" | "name";
export interface UploadListRequest extends PaginationRequest {
  q?: string;
  status?: UploadStatus;
  sort?: UploadSort;
}
export interface UploadListQuery extends Pagination {
  q?: string;
  status?: UploadStatus;
  sort?: UploadSort;
}
export interface Page<T> extends Pagination { data: T[]; total: number; }
export interface UploadView {
  id: string;
  fileName: string;
  status: string;
  totalRows: number | null;
  processedRows: number | null;
  failedRows: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface ResultRow { category: string; amount: number; unit: string; date: string; }
export interface UploadStats {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  pending: number;
  processing: number;
  processedRows: number;
  rejectedRows: number;
}
