import { expect, it } from "vitest";
import { securityHeaders } from "../../config/securityHeaders";

it("Pins browser connections to the configured API origin without blocking local HTTP", () => {
  const headers = Object.fromEntries(securityHeaders("http://localhost:3001/api/v1", "production").map(header => [header.key, header.value]));
  const csp = headers["Content-Security-Policy"];
  expect(csp).toContain("connect-src 'self' http://localhost:3001");
  expect(csp).toContain("script-src 'self' 'unsafe-inline'");
  expect(csp).not.toContain("unsafe-eval");
  expect(csp).not.toContain("upgrade-insecure-requests");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  expect(headers["X-Frame-Options"]).toBe("DENY");
});
it("Allows the development tooling only in development", () => {
  expect(securityHeaders("http://localhost:3001/api/v1", "development")[0].value).toContain("'unsafe-eval'");
});
it("Refuses unsupported public URLs and never serializes credentials", () => {
  for (const value of ["javascript:alert(1)", "bad", "https://user:pass@host/api/v1"]) expect(() => securityHeaders(value, "production")).toThrow("NEXT_PUBLIC_API_URL");
});
