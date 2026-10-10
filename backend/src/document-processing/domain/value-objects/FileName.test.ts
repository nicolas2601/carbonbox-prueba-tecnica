import { expect, it } from "vitest";
import { FileName } from "./FileName";

it.each(["report.csv", "other.csv", "  report.csv  ", "DATA.CSV"])("Accepts CSV name %s", raw => {
  const result = FileName.create(raw);
  expect(result.isRight()).toBe(true);
  if (result.isLeft()) throw result.value;
  expect(result.value.value).toBe(raw.trim());
});
