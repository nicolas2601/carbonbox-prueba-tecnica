import { http, HttpResponse } from "msw/http";
import { expect, it, vi } from "vitest";
import { API_URL, server } from "@/tests/server";
import { ApiError, normalizeApiError } from "./ApiError";
import { api, createApiClient } from "./client";

it.each([404, 503])("Normalizes backend envelopes with status %s", async status => {
  server.use(http.get(`${API_URL}/error`, () => HttpResponse.json({
    error: { code: "TEST_ERROR", message: "Please try again", requestId: "req-123" },
  }, { status })));
  await expect(api.get("/error")).rejects.toBeInstanceOf(ApiError);
  await expect(api.get("/error")).rejects.toMatchObject({
    code: "TEST_ERROR", message: "Please try again", status, requestId: "req-123",
  });
});
it("Normalizes unreachable servers without leaking transport details", async () => {
  server.use(http.get(`${API_URL}/offline`, () => HttpResponse.error()));
  await expect(api.get("/offline")).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 });
});
it.each(["<html>Proxy failure</html>", { error: null }, { error: { code: 1 } }])(
  "Handles non-envelope responses safely: %j", async body => {
    server.use(http.get(`${API_URL}/bad`, () => HttpResponse.json(body, { status: 502 })));
    await expect(api.get("/bad")).rejects.toMatchObject({ code: "HTTP_ERROR", status: 502 });
  },
);
it("Reads the configured API origin and preserves normalized errors", () => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test/api/v1");
  expect(createApiClient().defaults.baseURL).toBe("https://api.example.test/api/v1");
  const error = new ApiError("FAILED", "Try again", 400);
  expect(normalizeApiError(error)).toBe(error);
  expect(normalizeApiError(new Error("Private transport detail")).message).not.toContain("Private");
});
