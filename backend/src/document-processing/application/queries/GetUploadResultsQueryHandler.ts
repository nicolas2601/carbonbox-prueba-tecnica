import { Either } from "../../../shared/domain/Either";
import type { IUploadQueries } from "../ports/IUploadQueries";
import type { Page, PaginationRequest, ResultRow } from "./models";
import type { InvalidPaginationError } from "./InvalidPaginationError";
import { UploadNotFoundError } from "./UploadNotFoundError";
import { validatePagination } from "./validatePagination";

export interface GetUploadResultsQuery extends PaginationRequest { uploadId: string; }
export class GetUploadResultsQueryHandler {
  constructor(private readonly queries: IUploadQueries) {}
  async execute(query: GetUploadResultsQuery): Promise<Either<UploadNotFoundError | InvalidPaginationError, Page<ResultRow>>> {
    const pagination = validatePagination(query);
    if (pagination.isLeft()) return Either.left(pagination.value);
    if (!await this.queries.findById(query.uploadId)) return Either.left(new UploadNotFoundError());
    return Either.right(await this.queries.results(query.uploadId, pagination.value));
  }
}
