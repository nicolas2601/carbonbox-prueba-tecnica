import { Either } from "../../../shared/domain/Either";
import type { IUploadQueries } from "../ports/IUploadQueries";
import type { Page, UploadListRequest, UploadSort, UploadStatus, UploadView } from "./models";
import type { InvalidPaginationError } from "./InvalidPaginationError";
import { validatePagination } from "./validatePagination";
import { InvalidUploadFilterError } from "./InvalidUploadFilterError";

export type ListUploadsQuery = UploadListRequest;
type ListUploadsError = InvalidPaginationError | InvalidUploadFilterError;
const STATUSES: readonly UploadStatus[] = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];
const SORTS: readonly UploadSort[] = ["newest", "oldest", "name"];
const MAX_SEARCH_LENGTH = 200;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/u;

export class ListUploadsQueryHandler {
  constructor(private readonly queries: IUploadQueries) {}
  async execute(query: ListUploadsQuery = {}): Promise<Either<ListUploadsError, Page<UploadView>>> {
    const pagination = validatePagination(query);
    if (pagination.isLeft()) return Either.left(pagination.value);
    const q = query.q?.trim();
    if ((q?.length ?? 0) > MAX_SEARCH_LENGTH || (query.q !== undefined && CONTROL_CHARACTERS.test(query.q))) {
      return Either.left(new InvalidUploadFilterError("q must be at most 200 characters and contain no control characters"));
    }
    if (query.status !== undefined && !STATUSES.includes(query.status)) {
      return Either.left(new InvalidUploadFilterError("status must be a supported upload status"));
    }
    const sort = query.sort ?? "newest";
    if (!SORTS.includes(sort)) return Either.left(new InvalidUploadFilterError("sort must be newest, oldest or name"));
    const filters = { ...pagination.value, ...(q ? { q } : {}), ...(query.status ? { status: query.status } : {}), sort };
    return Either.right(await this.queries.list(filters));
  }
}
