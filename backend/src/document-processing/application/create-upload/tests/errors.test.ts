import { expect, it } from "vitest";
import { DomainError } from "../../../../shared/domain/DomainError";
import { StorageFailureError } from "../StorageFailureError";
import { UploadPersistenceError } from "../UploadPersistenceError";

it.each([
  [new StorageFailureError("Storage full"), "STORAGE_FAILURE", "Storage full"],
  [new UploadPersistenceError("Database failed"), "UPLOAD_PERSISTENCE_FAILURE", "Database failed"],
] as const)("Error codes: %s", (error, code, message) => {
  expect(error).toBeInstanceOf(DomainError);
  expect(error.code).toBe(code);
  expect(error.message).toBe(message);
});
