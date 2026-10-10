import { expect, it } from "vitest";
import { FileName } from "./FileName";
import { InvalidFileNameError } from "../errors/InvalidFileNameError";

it.each(["report.csv", "other.csv", "  report.csv  ", "DATA.CSV"])("Accepts CSV name %s", raw => {
  const result = FileName.create(raw);
  expect(result.isRight()).toBe(true);
  if (result.isLeft()) throw result.value;
  expect(result.value.value).toBe(raw.trim());
});

it.each(["   ", "report.xlsx", "../secrets.csv", "a\\b.csv", "bad\0.csv", "x".repeat(252) + ".csv"])("Rejects name %s", raw => {
  const result = FileName.create(raw);
  expect(result.isLeft()).toBe(true);
  expect(result.value).toBeInstanceOf(InvalidFileNameError);
});
it("Accepts the 255-character boundary", () => {
  expect(FileName.create("x".repeat(251) + ".csv").isRight()).toBe(true);
});
