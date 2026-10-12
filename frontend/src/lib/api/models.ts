export type UploadStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export interface Page<T> { data: T[]; total: number; page: number; limit: number; }
export interface Upload {
  id: string;
  fileName: string;
  status: UploadStatus;
  totalRows: number | null;
  processedRows: number | null;
  failedRows: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface UploadStats {
  total: number; completed: number; inProgress: number; failed: number;
  processedRows?: number; rejectedRows?: number; pending?: number; processing?: number;
}
// URL values remain raw so the API can report malformed filter links.
export interface UploadListFilters { q?: string; status?: string; sort?: string; }
export interface ResultRow { category: string; amount: number; unit: string; date: string; }
export interface CreatedUpload { id: string; status: "PENDING"; fileName: string; createdAt: string; }
