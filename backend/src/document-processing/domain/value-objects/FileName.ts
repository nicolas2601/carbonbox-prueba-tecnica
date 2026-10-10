import { Either } from "../../../shared/domain/Either";
import { InvalidFileNameError } from "../errors/InvalidFileNameError";

export class FileName {
  private constructor(readonly value: string) {}
  static create(raw: string): Either<InvalidFileNameError, FileName> {
    return Either.right(new FileName(raw.trim()));
  }
}
