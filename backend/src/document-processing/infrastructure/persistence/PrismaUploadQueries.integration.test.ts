import { afterAll, beforeEach, expect, it } from "vitest";
import { PrismaUploadQueries } from "./PrismaUploadQueries";
import { integrationClient, truncateTables } from "../tests/database";
import { NOW } from "../tests/queueFixtures";

const client = integrationClient();
const queries = new PrismaUploadQueries(client);
beforeEach(async () => { await truncateTables(client); });
afterAll(async () => { await client.$disconnect(); });
async function uploads(count: number): Promise<void> {
  await client.upload.createMany({ data: Array.from({ length: count }, (_, index) => ({
    id: `u${String(index).padStart(3, "0")}`, fileName: `u${index}.csv`, fileUrl: "private-key.csv", userId: "user",
    status: "PENDING", createdAt: NOW, updatedAt: NOW,
  })).reverse() });
}
it("Found views contain only public fields and ISO timestamps", async () => {
  await uploads(1);
  expect(await queries.findById("u000")).toEqual({ id: "u000", fileName: "u0.csv", status: "PENDING",
    totalRows: null, processedRows: null, failedRows: null, errorMessage: null, createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() });
  expect(await queries.findById("missing")).toBeNull();
});
it("Pagination in the database returns page3 of250 uploads", async () => {
  await uploads(250);
  const result = await queries.list({ page: 3, limit: 100 });
  expect(result).toMatchObject({ total: 250, page: 3, limit: 100 });
  expect(result.data).toHaveLength(50);
  expect(result.data[0]?.id).toBe("u200");
});
it("Stable order with equal timestamps returns each upload exactly once", async () => {
  await uploads(25);
  await client.upload.update({ where: { id: "u020" }, data: { createdAt: new Date(NOW.getTime() + 1000) } });
  const pages = await Promise.all([1, 2, 3].map(page => queries.list({ page, limit: 10 })));
  const ids = pages.flatMap(page => page.data.map(row => row.id));
  expect(ids[0]).toBe("u020");
  expect(ids).toHaveLength(25);
  expect(new Set(ids).size).toBe(25);
  expect(ids.slice(1)).toEqual(Array.from({ length: 25 }, (_, index) => `u${String(index).padStart(3, "0")}`).filter(id => id !== "u020"));
});
it("Empty list and a page beyond the last are not coerced", async () => {
  expect(await queries.list({ page: 1, limit: 10 })).toEqual({ data: [], total: 0, page: 1, limit: 10 });
  await uploads(1);
  expect(await queries.list({ page: 10, limit: 10 })).toEqual({ data: [], total: 1, page: 10, limit: 10 });
});
