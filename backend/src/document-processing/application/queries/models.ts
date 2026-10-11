export interface Pagination { page: number; limit: number; }
export interface PaginationRequest { page?: number; limit?: number; }
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
export interface UploadStats { total: number; completed: number; inProgress: number; failed: number; }
