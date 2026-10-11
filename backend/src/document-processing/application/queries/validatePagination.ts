import { Either } from "../../../shared/domain/Either";
import { InvalidPaginationError } from "./InvalidPaginationError";
import type { Pagination, PaginationRequest } from "./models";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export function pageOffset({ page, limit }: Pagination): number { return (page - 1) * limit; }
export function validatePagination(input: PaginationRequest = {}): Either<InvalidPaginationError, Pagination> {
  const page = input.page ?? DEFAULT_PAGE;
  const limit = input.limit ?? DEFAULT_LIMIT;
  if (!Number.isSafeInteger(page) || page < 1) return Either.left(new InvalidPaginationError("page must be a safe integer of at least 1"));
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_LIMIT) return Either.left(new InvalidPaginationError("limit must be an integer between 1 and 100"));
  if (!Number.isSafeInteger(pageOffset({ page, limit }))) return Either.left(new InvalidPaginationError("Pagination offset is not representable"));
  return Either.right({ page, limit });
}
