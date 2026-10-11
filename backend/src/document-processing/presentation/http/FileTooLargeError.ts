import { DomainError } from "../../../shared/domain/DomainError";

export class FileTooLargeError extends DomainError {
  constructor() { super("FILE_TOO_LARGE", "File exceeds the configured size limit"); }
}
