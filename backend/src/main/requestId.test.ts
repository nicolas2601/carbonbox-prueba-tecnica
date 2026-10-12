import { afterEach, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { loadSettings } from "../config";
import { App } from "./App";
import { requestId } from "../document-processing/presentation/http/requestId";

let server: FastifyInstance | undefined;
afterEach(async () => { await server?.close(); });
it("Accepts bounded safe correlation values and replaces unsafe input", () => {
  const ids = { next: () => "generated-id" };
  expect(requestId("client-123:abc", ids)).toBe("client-123:abc");
  for (const value of [undefined, "", "bad\nheader", "a".repeat(129), ["one", "two"], 42]) expect(requestId(value, ids)).toBe("generated-id");
});
it("Correlates client, response and real structured request logs", async () => {
  const logs: string[] = [];
  server = await new App({ ...loadSettings(), env: "development", logLevel: "info" }, undefined,
    { ids: { next: () => "generated-id" }, logStream: { write: line => { logs.push(line); } } }).build();
  const response = await server.inject({ url: "/health", headers: { "x-request-id": "client-123" } });
  expect(response.headers["x-request-id"]).toBe("client-123");
  const records = logs.map(line => JSON.parse(line) as { reqId?: string });
  expect(records.some(record => record.reqId === "client-123")).toBe(true);
});
it("Returns a generated identifier on errors and missing routes", async () => {
  server = await new App({ ...loadSettings(), env: "test" }, undefined, { ids: { next: () => "generated-id" } }).build();
  const response = await server.inject({ url: "/not-found", headers: { "x-request-id": "unsafe space" } });
  expect(response.statusCode).toBe(404);
  expect(response.headers["x-request-id"]).toBe("generated-id");
});
