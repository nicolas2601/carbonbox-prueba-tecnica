import { expect, it } from "vitest";
import { validatePagination } from "./validatePagination";
import { InvalidPaginationError } from "./InvalidPaginationError";
import { UploadNotFoundError } from "./UploadNotFoundError";
import { DomainError } from "../../../shared/domain/DomainError";
import type { Page, UploadView, ResultRow, UploadStats } from "./models";
import type { IUploadQueries } from "../ports/IUploadQueries";

it("Application errors expose unique stable codes", () => {
  const missing = new UploadNotFoundError();
  const pagination = new InvalidPaginationError("Bad pagination");
  expect(missing).toBeInstanceOf(DomainError);
  expect(pagination).toBeInstanceOf(DomainError);
  expect(missing.code).toBe("UPLOAD_NOT_FOUND");
  expect(pagination.code).toBe("INVALID_PAGINATION");
});
it.each([{ input: {}, expected: { page: 1, limit: 10 } }, { input: { page: 2, limit: 100 }, expected: { page: 2, limit: 100 } }])("Pagination defaults and boundaries: %j", ({ input, expected }) => {
  const result = validatePagination(input);
  expect(result.isRight()).toBe(true);
  expect(result.value).toEqual(expected);
});
it.each([{ page: 0 }, { page: -1 }, { page: 1.5 }, { page: NaN }, { page: Infinity }, { limit: 0 },
  { limit: 101 }, { limit: 1.5 }, { limit: NaN }, { page: Number.MAX_SAFE_INTEGER, limit: 100 }])("Out of range pagination: %j", input => {
  const result = validatePagination(input);
  expect(result.isLeft()).toBe(true);
  expect(result.value).toBeInstanceOf(InvalidPaginationError);
});
function verifyTypes(port: IUploadQueries): [Promise<UploadView | null>, Promise<Page<UploadView>>, Promise<Page<ResultRow>>, Promise<UploadStats>] {
  return [port.findById("u1"), port.list({ page: 1, limit: 10 }), port.results("u1", { page: 1, limit: 10 }), port.stats()];
}
void verifyTypes;
