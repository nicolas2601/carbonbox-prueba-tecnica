import type { Multipart, MultipartFile } from "@fastify/multipart";
import { DomainError } from "../../../shared/domain/DomainError";
import { ByteLimiter } from "./ByteLimiter";
import { FileTooLargeError } from "./FileTooLargeError";
import { RequestValidationError } from "./RequestValidationError";

export class MultipartUpload {
  failure: DomainError | null = null;
  private readonly limit: ByteLimiter;
  constructor(readonly part: MultipartFile, private readonly parts: AsyncIterableIterator<Multipart>, maxBytes: number) {
    this.limit = new ByteLimiter(part.file, maxBytes);
  }
  async *stream(): AsyncIterable<Uint8Array> {
    try {
      yield* this.limit.read();
      if (this.part.file.truncated) throw new FileTooLargeError();
      await this.validateTail();
    } catch (error) {
      if (this.limit.exceeded || this.part.file.truncated) this.failure = new FileTooLargeError();
      else if (error instanceof DomainError) this.failure = error;
      else if (error && typeof error === "object" && "statusCode" in error && Number(error.statusCode) < 500) {
        this.failure = new RequestValidationError("Invalid multipart request: only one file is allowed");
      }
      throw error;
    }
  }
  private async validateTail(): Promise<void> {
    for (let next = await this.parts.next(); !next.done; next = await this.parts.next()) {
      if (next.value.type === "file") {
        next.value.file.destroy();
        throw new RequestValidationError("Only one file is allowed");
      }
    }
  }
  async close(): Promise<void> {
    this.part.file.destroy();
    await this.parts.return?.();
  }
}
