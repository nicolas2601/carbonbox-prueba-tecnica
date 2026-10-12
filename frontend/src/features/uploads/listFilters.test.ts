import { expect, it } from "vitest";
import { filtersFromSearchParams, hasFilters, uploadsUrl } from "./listFilters";

it("Preserves raw URL enum values for server validation and trims filename search", () => {
  expect(filtersFromSearchParams({ q: ["  fuel_100%  ", "ignored"], status: "INVALID", sort: "name" }))
    .toEqual({ q: "fuel_100%", status: "INVALID", sort: "name" });
});
it("Preserves filters during pagination and encodes literal user text safely", () => {
  const url = uploadsUrl(2, { q: "100% fuel_", status: "COMPLETED", sort: "name" });
  const params = new URL(url, "http://localhost").searchParams;
  expect(params.get("q")).toBe("100% fuel_"); expect(params.get("page")).toBe("2");
  expect(params.get("status")).toBe("COMPLETED"); expect(params.get("sort")).toBe("name");
  expect(uploadsUrl(2)).toBe("/uploads?page=2");
});
it("Does not mistake default sort or whitespace for active filters", () => {
  expect(hasFilters({ q: " ", sort: "newest" })).toBe(false);
  expect(hasFilters({ status: "FAILED" })).toBe(true);
  expect(hasFilters({ sort: "oldest" })).toBe(true);
});
