import { Either } from "../../../shared/domain/Either";
import type { IUploadQueries } from "../ports/IUploadQueries";
import type { UploadView } from "./models";
import { UploadNotFoundError } from "./UploadNotFoundError";

export interface GetUploadByIdQuery { uploadId: string; }
export class GetUploadByIdQueryHandler {
  constructor(private readonly queries: IUploadQueries) {}
  async execute({ uploadId }: GetUploadByIdQuery): Promise<Either<UploadNotFoundError, UploadView>> {
    const upload = await this.queries.findById(uploadId);
    if (!upload) return Either.left(new UploadNotFoundError());
    return Either.right(upload);
  }
}
