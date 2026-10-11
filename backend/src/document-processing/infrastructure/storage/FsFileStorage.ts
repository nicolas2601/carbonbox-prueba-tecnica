import { lstat, mkdir, open, rename, rm } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import { Either } from "../../../shared/domain/Either";
import type { IFileStorage } from "../../application/ports/IFileStorage";
import type { IIdGenerator } from "../../application/ports/IIdGenerator";
import { StorageFailureError } from "../../application/create-upload/StorageFailureError";

function safeKey(key: string): boolean {
  return Boolean(key) && !key.includes("..") && !/[/\\\0]/.test(key);
}
function failure(error: unknown): StorageFailureError {
  return new StorageFailureError(error instanceof Error ? error.message : "Storage operation failed");
}
async function ensureAbsent(path: string): Promise<void> {
  try { await lstat(path); }
  catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
  throw new StorageFailureError("Generated file key already exists");
}

export class FsFileStorage implements IFileStorage {
  async *open(key: string): AsyncIterable<Uint8Array> {
    if (!safeKey(key)) throw new StorageFailureError("Invalid storage key");
    yield* createReadStream(join(this.directory, key));
  }
  constructor(private readonly directory: string, private readonly ids: IIdGenerator) {}
  async save(stream: AsyncIterable<Uint8Array>): Promise<Either<StorageFailureError, string>> {
    const id = this.ids.next();
    if (!safeKey(id)) return Either.left(new StorageFailureError("Invalid generated storage key"));
    const key = `${id}.csv`;
    const temporary = join(this.directory, `${key}.part`);
    let owned = false;
    try {
      await mkdir(this.directory, { recursive: true });
      const handle = await open(temporary, "wx");
      owned = true;
      try {
        await ensureAbsent(join(this.directory, key));
        await handle.writeFile(stream);
      } finally { await handle.close(); }
      await rename(temporary, join(this.directory, key));
      return Either.right(key);
    } catch (error) {
      if (owned) await rm(temporary, { force: true }).catch(() => undefined);
      return Either.left(failure(error));
    }
  }
  async delete(key: string): Promise<Either<StorageFailureError, void>> {
    if (!safeKey(key)) return Either.left(new StorageFailureError("Invalid storage key"));
    try {
      await rm(join(this.directory, key), { force: true });
      return Either.right(undefined);
    } catch (error) { return Either.left(failure(error)); }
  }
}
