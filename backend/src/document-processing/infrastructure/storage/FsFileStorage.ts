import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Either } from "../../../shared/domain/Either";
import type { IFileStorage } from "../../application/ports/IFileStorage";
import type { IIdGenerator } from "../../application/ports/IIdGenerator";
import { StorageFailureError } from "../../application/create-upload/StorageFailureError";

export class FsFileStorage implements IFileStorage {
  constructor(private readonly directory: string, private readonly ids: IIdGenerator) {}
  async save(stream: AsyncIterable<Uint8Array>): Promise<Either<StorageFailureError, string>> {
    const key = `${this.ids.next()}.csv`;
    await mkdir(this.directory, { recursive: true });
    await writeFile(join(this.directory, key), stream);
    return Either.right(key);
  }
  async delete(_key: string): Promise<Either<StorageFailureError, void>> {
    return Either.right(undefined);
  }
}
