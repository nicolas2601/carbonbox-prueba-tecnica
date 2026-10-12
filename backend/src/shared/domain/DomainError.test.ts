import { expect, it } from "vitest";
import { DomainError } from "./DomainError";
import { InvalidFileNameError } from "../../document-processing/domain/errors/InvalidFileNameError";
import { InvalidUploadStatusError } from "../../document-processing/domain/errors/InvalidUploadStatusError";
import { InvalidStatusTransitionError } from "../../document-processing/domain/errors/InvalidStatusTransitionError";
import { InvalidProgressError } from "../../document-processing/domain/errors/InvalidProgressError";
import { InvalidActivityDataError } from "../../document-processing/domain/errors/InvalidActivityDataError";

it.each(["empty", "path"])("A specific error exposes its code: %s", reason => {
  const error = new InvalidFileNameError(reason);
  expect(error.code).toBe("INVALID_FILE_NAME");
  expect(error.message).toContain(reason);
  expect(error).toBeInstanceOf(DomainError);
  expect(error).toBeInstanceOf(Error);
});
it("Codes are unique per error type", () => {
  const errors = [new InvalidFileNameError("name"), new InvalidUploadStatusError("DONE"),
    new InvalidStatusTransitionError("PENDING", "COMPLETED"), new InvalidProgressError("negative"),
    new InvalidActivityDataError("amount", "positive required")];
  expect(new Set(errors.map(error => error.code)).size).toBe(5);
  expect(errors.every(error => error instanceof DomainError)).toBe(true);
  expect(errors[4]).toMatchObject({ field: "amount" });
});
