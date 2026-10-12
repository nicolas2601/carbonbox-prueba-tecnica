import { expect, it } from "vitest";
import { GetUploadByIdQueryHandler } from "./GetUploadByIdQueryHandler";
import { UploadNotFoundError } from "./UploadNotFoundError";
import { MemoryUploadQueries, view } from "./tests/MemoryUploadQueries";

it.each(["u1", "u2"])("Existing upload: %s", async id => {
  const queries = new MemoryUploadQueries();
  const upload = view(id);
  queries.uploads.push(upload);
  const result = await new GetUploadByIdQueryHandler(queries).execute({ uploadId: id });
  expect(result.isRight()).toBe(true);
  expect(result.value).toEqual(upload);
});
it("Unknown id", async () => {
  const result = await new GetUploadByIdQueryHandler(new MemoryUploadQueries()).execute({ uploadId: "missing" });
  expect(result.isLeft()).toBe(true);
  expect(result.value).toBeInstanceOf(UploadNotFoundError);
});
