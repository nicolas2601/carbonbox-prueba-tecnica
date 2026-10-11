import { afterAll, beforeEach, expect, it } from "vitest";
import { PrismaUploadReader } from "./PrismaUploadReader";
import { integrationClient, truncateTables } from "../tests/database";
import { NOW, seedJob } from "../tests/queueFixtures";

const client = integrationClient();
beforeEach(async () => { await truncateTables(client); });
afterAll(async () => { await client.$disconnect(); });
it("Existing and missing uploads are rebuilt with every field", async () => {
  await seedJob(client);
  await client.upload.update({ where: { id: "u1" }, data: { status: "COMPLETED", totalRows: 5,
    processedRows: 3, failedRows: 2, errorMessage: "2 rejected", updatedAt: NOW } });
  const reader = new PrismaUploadReader(client);
  const result = await reader.findById("u1");
  expect(result).toMatchObject({ id: "u1", fileName: { value: "report.csv" }, fileUrl: "u1.csv", userId: "user",
    status: "COMPLETED", totalRows: 5, processedRows: 3, failedRows: 2, errorMessage: "2 rejected", createdAt: NOW, updatedAt: NOW });
  expect(await reader.findById("missing")).toBeNull();
});
