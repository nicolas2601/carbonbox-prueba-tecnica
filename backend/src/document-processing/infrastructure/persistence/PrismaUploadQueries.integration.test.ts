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

it("Results use only own rows ordered by date then id with number and UTC date formats", async () => {
  await uploads(2);
  await client.activityData.createMany({ data: [
    { id: "b", uploadId: "u000", category: "Later", amount: 1378.8, unit: "kWh", date: new Date("2024-04-11T00:00:00Z") },
    { id: "c", uploadId: "u000", category: "Second tie", amount: 20, unit: "m3", date: new Date("2024-04-10T00:00:00Z") },
    { id: "a", uploadId: "u000", category: "First tie", amount: 10, unit: "m3", date: new Date("2024-04-10T00:00:00Z") },
    { id: "other", uploadId: "u001", category: "Other upload", amount: 100, unit: "kg", date: new Date("2024-01-01T00:00:00Z") },
  ] });
  const result = await queries.results("u000", { page: 1, limit: 10 });
  expect(result.total).toBe(3);
  expect(result.data.map(row => row.category)).toEqual(["First tie", "Second tie", "Later"]);
  expect(result.data[2]).toEqual({ category: "Later", amount: 1378.8, unit: "kWh", date: "2024-04-11" });
});
it("Existing upload without rows returns an empty page", async () => {
  await uploads(1);
  expect(await queries.results("u000", { page: 1, limit: 10 })).toEqual({ data: [], total: 0, page: 1, limit: 10 });
});
it("Large result set returns page50 of5000 rows with a stable tie breaker", async () => {
  await uploads(1);
  await client.activityData.createMany({ data: Array.from({ length: 5000 }, (_, index) => ({
    id: `r${String(index).padStart(4, "0")}`, uploadId: "u000", category: `r${String(index).padStart(4, "0")}`,
    amount: index + 1, unit: "m3", date: new Date("2024-04-11T00:00:00Z"),
  })).reverse() });
  const result = await queries.results("u000", { page: 50, limit: 100 });
  expect(result).toMatchObject({ total: 5000, page: 50, limit: 100 });
  expect(result.data).toHaveLength(100);
  expect(result.data[0]).toMatchObject({ category: "r4900", amount: 4901, date: "2024-04-11" });
  expect(result.data[99]?.category).toBe("r4999");
});
