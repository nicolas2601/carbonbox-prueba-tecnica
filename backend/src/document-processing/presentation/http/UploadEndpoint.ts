import type { FastifyRequest } from "fastify";
import { Either } from "../../../shared/domain/Either";
import type { CreateUploadCommandHandler } from "../../application/create-upload/CreateUploadCommandHandler";
import type { CreateUploadResult } from "../../application/create-upload/CreateUploadCommand";
import { MultipartUpload } from "./MultipartUpload";
import { MissingFileError, RequestValidationError } from "./RequestValidationError";
import { FILE_PART_NAME } from "./uploadRouteSchema";

// The exercise deliberately assumes a single user and has no authentication.
export const ANONYMOUS_USER_ID = "anonymous";

export class UploadEndpoint {
  constructor(private readonly handler: Pick<CreateUploadCommandHandler, "execute">, private readonly maxBytes: number) {}
  async execute(request: FastifyRequest): Promise<Either<Error, CreateUploadResult>> {
    const input = await this.firstFile(request);
    if (input.isLeft()) return Either.left(input.value);
    const upload = input.value;
    try {
      const result = await this.handler.execute({ fileName: upload.part.filename, stream: upload.stream(), userId: ANONYMOUS_USER_ID });
      if (upload.failure) return Either.left(upload.failure);
      return result;
    } finally { await upload.close(); }
  }
  private async firstFile(request: FastifyRequest): Promise<Either<Error, MultipartUpload>> {
    if (!request.isMultipart()) return Either.left(new RequestValidationError("Expected multipart/form-data"));
    const parts = request.parts();
    let next = await parts.next();
    while (!next.done && next.value.type === "field") next = await parts.next();
    if (next.done) return Either.left(new MissingFileError());
    if (next.value.type !== "file" || next.value.fieldname !== FILE_PART_NAME) {
      if (next.value.type === "file") next.value.file.destroy();
      await parts.return?.();
      return Either.left(new RequestValidationError("File part must be named file"));
    }
    return Either.right(new MultipartUpload(next.value, parts, this.maxBytes));
  }
}
