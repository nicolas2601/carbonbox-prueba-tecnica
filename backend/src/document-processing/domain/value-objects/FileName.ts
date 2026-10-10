import { Either } from "../../../shared/domain/Either";
import { InvalidFileNameError } from "../errors/InvalidFileNameError";

export class FileName {
  private static readonly MAX_LENGTH = 255;
  private constructor(readonly value: string) {}
  static create(raw: string): Either<InvalidFileNameError, FileName> {
    const value = raw.trim();
    if (!value || value.length > FileName.MAX_LENGTH || !/\.csv$/i.test(value) || /[/\\\0]/.test(raw)) {
      return Either.left(new InvalidFileNameError("Expected a CSV name without path separators, at most 255 characters"));
    }
    return Either.right(new FileName(value));
  }
}
