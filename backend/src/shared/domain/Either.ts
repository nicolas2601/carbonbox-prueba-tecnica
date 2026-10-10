export type Either<L, R> = Left<L, R> | Right<L, R>;

export class Left<L, R> {
  readonly side = "left";
  constructor(readonly value: L) {}
  isLeft(): this is Left<L, R> { return true; }
  isRight(): this is Right<L, R> { return false; }
}

export class Right<L, R> {
  readonly side = "right";
  constructor(readonly value: R) {}
  isLeft(): this is Left<L, R> { return false; }
  isRight(): this is Right<L, R> { return true; }
}

export const Either = {
  left<L, R = never>(value: L): Either<L, R> { return new Left<L, R>(value); },
  right<L = never, R = never>(value: R): Either<L, R> { return new Right<L, R>(value); },
};
