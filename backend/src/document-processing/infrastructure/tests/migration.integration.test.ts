import { afterAll, beforeEach, expect, it } from "vitest";
import { integrationClient, truncateTables } from "./database";

const client = integrationClient();
beforeEach(async () => { await truncateTables(client); });
afterAll(async () => { await client.$disconnect(); });
it("The migration creates the queue schema, index and cascading foreign key", async () => {
  const columns = await client.$queryRaw<{ column_name: string }[]>`SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs'`;
  expect(columns.map(column => column.column_name)).toEqual(expect.arrayContaining([
    "id", "uploadId", "status", "attempts", "maxAttempts", "availableAt", "lockedUntil",
    "claimToken", "lastError", "createdAt", "updatedAt",
  ]));
  const indexes = await client.$queryRaw<{ indexdef: string }[]>`SELECT indexdef FROM pg_indexes WHERE tablename = 'jobs'`;
  expect(indexes.some(index => index.indexdef.includes('("status", "availableAt")') || index.indexdef.includes('(status, "availableAt")'))).toBe(true);
  const constraints = await client.$queryRaw<{ confdeltype: string }[]>`SELECT confdeltype::text FROM pg_constraint WHERE conrelid = 'jobs'::regclass AND contype = 'f'`;
  expect(constraints).toEqual([{ confdeltype: "c" }]);
});
