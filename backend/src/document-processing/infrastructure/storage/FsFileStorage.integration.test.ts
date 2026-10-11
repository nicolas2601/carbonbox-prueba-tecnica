import { afterEach, beforeEach, expect, it } from "vitest";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FsFileStorage } from "./FsFileStorage";
import type { IIdGenerator } from "../../application/ports/IIdGenerator";

class SequenceIds implements IIdGenerator {
  private value = 0;
  next(): string { return `file-${++this.value}`; }
}
let root: string;
let storageDir: string;
let storage: FsFileStorage;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "carbonbox-storage-"));
  storageDir = join(root, "uploads");
  storage = new FsFileStorage(storageDir, new SequenceIds());
});
afterEach(async () => { await rm(root, { recursive: true, force: true }); });
async function* bytes(): AsyncIterable<Uint8Array> {
  yield new TextEncoder().encode("category,amount,unit,date\n");
  yield new TextEncoder().encode("Water,10,m3,2024-01-15\n");
}
it("Saving a stream", async () => {
  const result = await storage.save(bytes());
  expect(result.isRight()).toBe(true);
  if (result.isLeft()) throw result.value;
  expect(result.value).toBe("file-1.csv");
  expect(await readFile(join(storageDir, result.value), "utf8")).toBe("category,amount,unit,date\nWater,10,m3,2024-01-15\n");
});
it("Missing directory is created", async () => {
  await expect(stat(storageDir)).rejects.toMatchObject({ code: "ENOENT" });
  expect((await storage.save(bytes())).isRight()).toBe(true);
  expect((await stat(storageDir)).isDirectory()).toBe(true);
});
