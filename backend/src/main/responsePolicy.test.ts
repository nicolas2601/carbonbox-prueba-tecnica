import { gzipSync, gunzipSync } from "node:zlib";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { App } from "./App";
import { loadSettings } from "../config";
import type { ApiServices } from "../document-processing/presentation/http/ApiServices";
import { Either } from "../shared/domain/Either";

const ID = "00000000-0000-4000-8000-000000000001";
const upload = { id: ID, fileName: "large.csv", status: "COMPLETED", totalRows: 5000, processedRows: 5000, failedRows: 0,
  errorMessage: null, createdAt: "2024-10-12T00:00:00.000Z", updatedAt: "2024-10-12T00:00:01.000Z" };
const results = { data: Array.from({ length: 25 }, () => ({ category: "Energy category ".repeat(12), amount: 123.4567, unit: "kWh", date: "2024-10-12" })), total: 5000, page: 1, limit: 25 };
let server: FastifyInstance;
beforeEach(async () => {
  const services: ApiServices = { createUpload: { execute: vi.fn<ApiServices["createUpload"]["execute"]>() },
    getUploadById: { execute: async () => Either.right(upload) },
    getUploadStats: { execute: async () => Either.right({ total: 1, completed: 1, inProgress: 0, failed: 0 }) },
    listUploads: { execute: async () => Either.right({ data: [upload], total: 1, page: 1, limit: 10 }) },
    getUploadResults: { execute: async () => Either.right(results) }, ready: async () => {} };
  server = await new App({ ...loadSettings(), env: "test" }, services).build();
});
afterEach(async () => { await server.close(); });

it.each(["/api/v1/uploads", "/api/v1/uploads/stats", `/api/v1/uploads/${ID}`, `/api/v1/uploads/${ID}/results`])("Never stores upload data at %s", async url => {
  const response = await server.inject({ url });
  expect(response.statusCode).toBe(200);
  expect(response.headers["cache-control"]).toBe("no-store");
});
it("Compresses large negotiated JSON without changing dates, decimals or rows", async () => {
  const response = await server.inject({ url: `/api/v1/uploads/${ID}/results?limit=25`, headers: { "accept-encoding": "gzip" } });
  expect(response.statusCode).toBe(200);
  expect(response.headers["content-encoding"]).toBe("gzip");
  expect(response.headers.vary).toContain("accept-encoding");
  expect(response.headers["content-type"]).toBe("application/json; charset=utf-8");
  if (response.headers["content-length"]) expect(Number(response.headers["content-length"])).toBe(response.rawPayload.length);
  expect(JSON.parse(gunzipSync(response.rawPayload).toString())).toEqual(results);
  expect(response.rawPayload.length).toBeLessThan(Buffer.byteLength(JSON.stringify(results)));
});
it("Leaves small or unnegotiated JSON uncompressed", async () => {
  const small = await server.inject({ url: "/api/v1/uploads/stats", headers: { "accept-encoding": "gzip" } });
  const plain = await server.inject({ url: `/api/v1/uploads/${ID}/results?limit=25` });
  expect(small.headers["content-encoding"]).toBeUndefined();
  expect(plain.headers["content-encoding"]).toBeUndefined();
  expect(plain.json()).toEqual(results);
});
it("Does not cache failed upload-data requests", async () => {
  const invalid = await server.inject({ url: "/api/v1/uploads?page=invalid" });
  const rejected = await server.inject({ method: "POST", url: "/api/v1/uploads", payload: { invalid: true } });
  expect(invalid.statusCode).toBe(400);
  expect(rejected.statusCode).toBeGreaterThanOrEqual(400);
  expect(invalid.headers["cache-control"]).toBe("no-store");
  expect(rejected.headers["cache-control"]).toBe("no-store");
});
it("Does not introduce request decompression", async () => {
  server.post("/json-input", async request => request.body);
  const response = await server.inject({ method: "POST", url: "/json-input", headers: { "content-type": "application/json", "content-encoding": "gzip" }, payload: gzipSync('{"value":1}') });
  expect(response.statusCode).toBe(400);
});
