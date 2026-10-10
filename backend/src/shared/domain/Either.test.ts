import { describe, expect, it } from "vitest";
import { Either, type Left, type Right } from "./Either";

describe("Either", () => {
  it.each([42, 7])("A right holds a success value: %s", (value) => {
    const result = Either.right<string, number>(value);
    expect(result.isRight()).toBe(true);
    expect(result.isLeft()).toBe(false);
    expect(result.value).toBe(value);
  });
  it("A left holds a failure", () => {
    const error = new Error("boom");
    const result = Either.left<Error, number>(error);
    expect(result.isLeft()).toBe(true);
    expect(result.isRight()).toBe(false);
    expect(result.value).toBe(error);
  });
});

function narrow(result: Either<string, number>): number {
  if (result.isLeft()) {
    const left: Left<string, number> = result;
    const error: string = left.value;
    return error.length;
  }
  const right: Right<string, number> = result;
  const value: number = right.value;
  return value;
}
void narrow;
