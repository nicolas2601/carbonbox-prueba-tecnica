import { expect, it } from "vitest";
import { testDatabaseUrl } from "./testDatabaseUrl";

const testUrl = "postgresql://postgres:postgres@localhost:5432/carbonbox_test";
it("Accepts only an explicit local test database", () => {
  expect(testDatabaseUrl(testUrl)).toBe(testUrl);
});
it.each([undefined, "postgresql://postgres:postgres@localhost:5432/document_processing", "postgresql://postgres:postgres@example.com/carbonbox_test", "not a URL"])("Refuses unsafe test database %s", value => {
  expect(() => testDatabaseUrl(value)).toThrow();
});
