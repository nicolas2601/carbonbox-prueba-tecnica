import type { Either } from "../../../shared/domain/Either";
import type { Upload } from "../../domain/entities/Upload";
import type { UploadPersistenceError } from "../create-upload/UploadPersistenceError";
import type { ProcessFileJob } from "./ProcessFileJob";

export interface IUploadRepository {
  // Persists the upload and its job atomically: both or neither.
  saveWithJob(upload: Upload, job: ProcessFileJob): Promise<Either<UploadPersistenceError, void>>;
}
