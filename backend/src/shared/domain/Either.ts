export type Either<L, R> = Left<L, R> | Right<L, R>;

export class Left<L, R> {
  readonly side = "left";
  constructor(readonly value: L) {}
  isLeft(): this is Left<L, R> { return true; }
  isRight(): this is Right<L, R> { return false; }
  fold<T>(onLeft: (value: L) => T, _onRight: (value: R) => T): T { return onLeft(this.value); }
  map<T>(_transform: (value: R) => T): Either<L, T> { return this as unknown as Left<L, T>; }
  flatMap<T>(_transform: (value: R) => Either<L, T>): Either<L, T> {
    return this as unknown as Left<L, T>;
  }
}

export class Right<L, R> {
  readonly side = "right";
  constructor(readonly value: R) {}
  isLeft(): this is Left<L, R> { return false; }
  isRight(): this is Right<L, R> { return true; }
  fold<T>(_onLeft: (value: L) => T, onRight: (value: R) => T): T { return onRight(this.value); }
  map<T>(transform: (value: R) => T): Either<L, T> { return new Right<L, T>(transform(this.value)); }
  flatMap<T>(transform: (value: R) => Either<L, T>): Either<L, T> { return transform(this.value); }
}

export const Either = {
  left<L, R = never>(value: L): Either<L, R> { return new Left<L, R>(value); },
  right<L = never, R = never>(value: R): Either<L, R> { return new Right<L, R>(value); },
};
