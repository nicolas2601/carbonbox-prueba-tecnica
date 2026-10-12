import { afterEach, beforeEach, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { App } from "./App";
import { loadSettings } from "../config";
import { corsOrigins } from "../document-processing/presentation/http/corsOrigins";

let server: FastifyInstance;
beforeEach(async () => { server = await new App({ ...loadSettings(), env: "test", corsOrigin: "http://localhost:3000,https://app.example.com" }).build(); });
afterEach(async () => { await server.close(); });
it.each(["/health", "/missing", "/docs/json"])("Adds security headers without exposing technology at %s", async url => {
  const response = await server.inject({ url });
  expect(response.headers["x-content-type-options"]).toBe("nosniff");
  expect(response.headers["x-frame-options"]).toBe("DENY");
  expect(response.headers["x-powered-by"]).toBeUndefined();
  expect(response.headers.server).toBeUndefined();
});
it("Allows only configured origins and explicit methods/headers", async () => {
  const response = await server.inject({ method: "OPTIONS", url: "/health", headers: { origin: "https://app.example.com", "access-control-request-method": "POST", "access-control-request-headers": "content-type,x-request-id" } });
  expect(response.statusCode).toBe(204);
  expect(response.headers["access-control-allow-origin"]).toBe("https://app.example.com");
  expect(response.headers["access-control-allow-methods"]).not.toContain("DELETE");
  expect(response.headers["access-control-allow-headers"]).not.toContain("authorization");
  expect(response.headers["access-control-allow-credentials"]).toBeUndefined();
});
it("Returns no allow-origin header for an unconfigured preflight", async () => {
  const response = await server.inject({ method: "OPTIONS", url: "/health", headers: { origin: "https://evil.example", "access-control-request-method": "GET" } });
  expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  expect(response.body).not.toContain("evil.example");
});
it("Rejects wildcard, credential-bearing and non-origin configuration", () => {
  expect(corsOrigins("http://localhost:3000, https://app.example.com")).toEqual(["http://localhost:3000", "https://app.example.com"]);
  for (const value of ["", "*", "http://host/path", "http://user:pass@host", "file:///tmp", "http://host?token=one"]) {
    expect(() => corsOrigins(value)).toThrow("CORS_ORIGIN");
  }
});
