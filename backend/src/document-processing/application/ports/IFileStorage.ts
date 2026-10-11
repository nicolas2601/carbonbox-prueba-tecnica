import type { Either } from "../../../shared/domain/Either";
import type { StorageFailureError } from "../create-upload/StorageFailureError";

export interface IFileStorage {
  save(stream: AsyncIterable<Uint8Array>): Promise<Either<StorageFailureError, string>>;
  delete(key: string): Promise<Either<StorageFailureError, void>>;
}
