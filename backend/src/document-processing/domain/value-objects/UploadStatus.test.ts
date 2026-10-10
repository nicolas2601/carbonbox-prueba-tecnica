import { expect, it } from "vitest";
import { UploadStatus } from "./UploadStatus";
import { InvalidUploadStatusError } from "../errors/InvalidUploadStatusError";

it.each(["PENDING", "PROCESSING", "COMPLETED", "FAILED"])("A known status is accepted: %s", value => {
  const result = UploadStatus.create(value);
  expect(result.isRight()).toBe(true);
  if (result.isLeft()) throw result.value;
  expect(result.value.value).toBe(value);
});
it.each(["DONE", "pending", ""])("An unknown status is rejected: %s", value => {
  const result = UploadStatus.create(value);
  expect(result.isLeft()).toBe(true);
  expect(result.value).toBeInstanceOf(InvalidUploadStatusError);
});
