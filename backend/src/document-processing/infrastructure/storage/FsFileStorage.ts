import { mkdir, open, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { Either } from "../../../shared/domain/Either";
import type { IFileStorage } from "../../application/ports/IFileStorage";
import type { IIdGenerator } from "../../application/ports/IIdGenerator";
import { StorageFailureError } from "../../application/create-upload/StorageFailureError";

export class FsFileStorage implements IFileStorage {
  constructor(private readonly directory: string, private readonly ids: IIdGenerator) {}
  async save(stream: AsyncIterable<Uint8Array>): Promise<Either<StorageFailureError, string>> {
    const key = `${this.ids.next()}.csv`;
    const temporary = join(this.directory, `${key}.part`);
    let owned = false;
    try {
      await mkdir(this.directory, { recursive: true });
      const handle = await open(temporary, "wx");
      owned = true;
      try { await handle.writeFile(stream); }
      finally { await handle.close(); }
      await rename(temporary, join(this.directory, key));
      return Either.right(key);
    } catch (error) {
      if (owned) await rm(temporary, { force: true }).catch(() => undefined);
      return Either.left(new StorageFailureError(error instanceof Error ? error.message : "Unable to store file"));
    }
  }
  async delete(key: string): Promise<Either<StorageFailureError, void>> {
    await rm(join(this.directory, key), { force: true });
    return Either.right(undefined);
  }
}
