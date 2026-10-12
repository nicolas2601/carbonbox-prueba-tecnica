import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { loadSettings } from "../config";
import { App } from "./App";

describe("GET /health", () => {
  let server: FastifyInstance;

  afterEach(async () => {
    await server.close();
  });

  it("reports the service as healthy", async () => {
    server = await new App(loadSettings()).build();

    const response = await server.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("allows the configured browser origin", async () => {
    const settings = { ...loadSettings(), corsOrigin: "http://localhost:3000" };
    server = await new App(settings).build();

    const response = await server.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://localhost:3000" },
    });

    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });
});
