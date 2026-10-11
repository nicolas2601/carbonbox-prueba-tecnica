import { Either } from "../../../shared/domain/Either";
import type { IUploadQueries } from "../ports/IUploadQueries";
import type { Page, PaginationRequest, UploadView } from "./models";
import type { InvalidPaginationError } from "./InvalidPaginationError";
import { validatePagination } from "./validatePagination";

export type ListUploadsQuery = PaginationRequest;
export class ListUploadsQueryHandler {
  constructor(private readonly queries: IUploadQueries) {}
  async execute(query: ListUploadsQuery = {}): Promise<Either<InvalidPaginationError, Page<UploadView>>> {
    const pagination = validatePagination(query);
    if (pagination.isLeft()) return Either.left(pagination.value);
    return Either.right(await this.queries.list(pagination.value));
  }
}
