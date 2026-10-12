import { expect, it } from "vitest";
import { errorResponse, statusForCode } from "./errorResponse";

it.each([
  ["INVALID_FILE_NAME", 400], ["INVALID_PAGINATION", 400], ["INVALID_UPLOAD_FILTER", 400], ["MISSING_FILE", 400], ["VALIDATION_ERROR", 400],
  ["UPLOAD_NOT_FOUND", 404], ["ROUTE_NOT_FOUND", 404], ["FILE_TOO_LARGE", 413], ["STORAGE_FAILURE", 500],
  ["UPLOAD_PERSISTENCE_FAILURE", 500], ["UNKNOWN", 500], ["SERVICE_UNAVAILABLE", 503], ["constructor", 500], ["__proto__", 500],
] as const)("Mapping table: %s", (code, status) => { expect(statusForCode(code)).toBe(status); });
it("Client errors retain specific text in exactly one envelope", () => {
  expect(errorResponse("INVALID_FILE_NAME", "Expected CSV", "req-1")).toEqual({ status: 400, body: { error: { code: "INVALID_FILE_NAME", message: "Expected CSV" } } });
});
it("Server errors hide internals and return the Fastify request id", () => {
  expect(errorResponse("STORAGE_FAILURE", "db.private.example broke", "req-1")).toEqual({ status: 500,
    body: { error: { code: "INTERNAL_ERROR", message: "Internal server error", requestId: "req-1" } } });
});
it("Readiness uses the same safe envelope with 503", () => {
  expect(errorResponse("SERVICE_UNAVAILABLE", "db.private.example", "req-2")).toEqual({ status: 503,
    body: { error: { code: "SERVICE_UNAVAILABLE", message: "Database unavailable", requestId: "req-2" } } });
});
