import { expect, it } from "vitest";
import { parsePage } from "./pagination";

it.each([[undefined, 1], ["abc", 1], ["0", 1], ["-1", 1], ["1.5", 1], ["1e3", 1], [["1", "2"], 1],
  ["9007199254740991", 1], ["2", 2], ["01", 1]])("Parses URL page %j", (value, expected) => {
  expect(parsePage(value)).toBe(expected);
});
it("Validates derived offsets against the results page size too", () => {
  expect(parsePage("900719925474099", 25)).toBe(1);
  expect(parsePage("3", 25)).toBe(3);
});
