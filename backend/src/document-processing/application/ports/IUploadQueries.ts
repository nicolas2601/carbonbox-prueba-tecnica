import type { Page, Pagination, ResultRow, UploadView, UploadStats } from "../queries/models";

export interface IUploadQueries {
  findById(id: string): Promise<UploadView | null>;
  list(pagination: Pagination): Promise<Page<UploadView>>;
  results(uploadId: string, pagination: Pagination): Promise<Page<ResultRow>>;
  stats(): Promise<UploadStats>;
}
