import { Either } from "../../../shared/domain/Either";
import type { IClock } from "../ports/IClock";
import type { IDeadJobRequeue, RequeuedJob } from "../ports/IDeadJobRequeue";
import { RequeueError } from "./RequeueError";

const MAX_IDENTIFIER_LENGTH = 200;
export class RequeueDeadJob {
  constructor(private readonly repository: IDeadJobRequeue, private readonly clock: IClock) {}
  async execute(uploadId: string): Promise<Either<RequeueError, RequeuedJob>> {
    if (!uploadId || uploadId !== uploadId.trim() || uploadId.length > MAX_IDENTIFIER_LENGTH || /[\x00-\x1f\x7f]/.test(uploadId)) {
      return Either.left(new RequeueError("INVALID_REQUEUE_ID", "A valid uploadId is required"));
    }
    return this.repository.requeue(uploadId, this.clock.now());
  }
}
