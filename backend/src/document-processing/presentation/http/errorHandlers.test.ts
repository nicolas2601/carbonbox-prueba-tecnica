import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, expect, it } from "vitest";
import { registerErrorHandlers } from "./errorHandlers";

let server: FastifyInstance;
afterEach(async () => { await server.close(); });
it("Unexpected exception exposes only fixed text and correlates the real log cause", async () => {
  const logs: string[] = [];
  server = Fastify({ logger: { level: "error", stream: { write: line => { logs.push(line); } } } });
  registerErrorHandlers(server);
  server.get("/boom", async () => { throw new Error("Database host db.private.example is down"); });
  const response = await server.inject("/boom");
  expect(response.statusCode).toBe(500);
  expect(response.json()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal server error", requestId: expect.any(String) } });
  expect(response.body).not.toContain("db.private.example");
  expect(logs.join("\n")).toContain("db.private.example");
  expect(logs.join("\n")).toContain(response.json().error.requestId);
});
it("Bad parameter uses the envelope and names its field", async () => {
  server = Fastify();
  registerErrorHandlers(server);
  server.get("/validate", { schema: { querystring: { type: "object", properties: { limit: { type: "number" } } } } }, async () => ({}));
  const response = await server.inject("/validate?limit=abc");
  expect(response.statusCode).toBe(400);
  expect(response.json()).toMatchObject({ error: { code: "VALIDATION_ERROR", message: expect.stringContaining("limit") } });
});
it("Unknown route is consistent JSON", async () => {
  server = Fastify();
  registerErrorHandlers(server);
  const response = await server.inject("/api/v1/nope");
  expect(response.statusCode).toBe(404);
  expect(response.json()).toEqual({ error: { code: "ROUTE_NOT_FOUND", message: "Route not found" } });
});
