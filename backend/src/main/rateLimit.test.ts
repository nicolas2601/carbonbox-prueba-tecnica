import { afterEach, beforeEach, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { App } from "./App";
import { loadSettings } from "../config";

let server: FastifyInstance;
beforeEach(async () => {
  server = await new App({ ...loadSettings(), env: "test", rateLimitMax: 3, uploadRateLimitMax: 1, rateLimitWindowMs: 60000 }).build();
  server.post("/api/v1/uploads", async () => ({ accepted: true }));
});
afterEach(async () => { await server.close(); });
it("Keeps read and tighter upload quotas independent and returns the standard 429", async () => {
  for (let index = 0; index < 3; index++) expect((await server.inject("/health")).statusCode).toBe(200);
  expect((await server.inject({ method: "POST", url: "/api/v1/uploads" })).statusCode).toBe(200);
  const limited = await server.inject({ method: "POST", url: "/api/v1/uploads" });
  expect(limited.statusCode).toBe(429);
  expect(limited.json()).toEqual({ error: { code: "RATE_LIMITED", message: "Too many requests" } });
  expect(Number(limited.headers["retry-after"])).toBeGreaterThan(0);
  expect(limited.headers["x-request-id"]).toBeTruthy();
  expect(limited.headers["cache-control"]).toBe("no-store");
  expect((await server.inject("/health")).statusCode).toBe(429);
});
it("Does not trust spoofed forwarded IPs or charge preflight to the data budget", async () => {
  for (let index = 0; index < 3; index++) await server.inject("/health");
  const spoofed = await server.inject({ url: "/health", headers: { "x-forwarded-for": "203.0.113.4" } });
  expect(spoofed.statusCode).toBe(429);
  const preflight = await server.inject({ method: "OPTIONS", url: "/health", headers: { origin: "http://localhost:3000", "access-control-request-method": "GET" } });
  expect(preflight.statusCode).toBe(204);
});
