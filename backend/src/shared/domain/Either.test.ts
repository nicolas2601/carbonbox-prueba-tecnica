import { describe, expect, it, vi } from "vitest";
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

describe("transformations", () => {
  it.each([2, 5])("Map on a right: %s", value => {
    expect(Either.right<string, number>(value).map(n => n * 2).value).toBe(value * 2);
  });
  it("Map on a left", () => {
    const left = Either.left<string, number>("boom");
    const transform = vi.fn();
    expect(left.map(transform)).toBe(left);
    expect(left.flatMap(transform)).toBe(left);
    expect(transform).not.toHaveBeenCalled();
  });
  it("FlatMap stops at the first failure", () => {
    const failure = Either.left<string, number>("boom");
    const third = vi.fn();
    const result = Either.right<string, number>(2)
      .flatMap(n => Either.right<string, number>(n + 1))
      .flatMap(() => failure).flatMap(third);
    expect(result).toBe(failure);
    expect(third).not.toHaveBeenCalled();
  });
});

describe("fold", () => {
  it("Fold on a right", () => {
    const onLeft = vi.fn();
    expect(Either.right<string, number>(2).fold(onLeft, value => value * 2)).toBe(4);
    expect(onLeft).not.toHaveBeenCalled();
  });
  it("Fold on a left", () => {
    const onRight = vi.fn();
    expect(Either.left<string, number>("boom").fold(value => `[${value}]`, onRight)).toBe("[boom]");
    expect(onRight).not.toHaveBeenCalled();
  });
});
