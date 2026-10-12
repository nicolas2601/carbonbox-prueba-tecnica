import { Readable } from "node:stream";
import type { Multipart, MultipartFile } from "@fastify/multipart";
import { expect, it } from "vitest";
import { MultipartUpload } from "./MultipartUpload";
import { RequestValidationError } from "./RequestValidationError";

function part(filename: string): MultipartFile {
  return { type: "file", fieldname: "file", filename, encoding: "7bit", mimetype: "text/csv", fields: {},
    file: Object.assign(Readable.from([Buffer.from("csv")]), { truncated: false, bytesRead: 3 }),
    toBuffer: async () => Buffer.from("csv") };
}
it("Rejects and destroys a second file even if the parser yields it instead of enforcing its limit", async () => {
  const first = part("first.csv");
  const second = part("second.csv");
  async function* tail(): AsyncIterableIterator<Multipart> { yield second; }
  const upload = new MultipartUpload(first, tail(), 100);
  const consume = async () => { for await (const _chunk of upload.stream()) { /* Fully consume the upload. */ } };
  await expect(consume()).rejects.toThrow("Only one file is allowed");
  expect(upload.failure).toBeInstanceOf(RequestValidationError);
  expect(second.file.destroyed).toBe(true);
  await upload.close();
});
