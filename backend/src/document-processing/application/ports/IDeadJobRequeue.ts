import type { Either } from "../../../shared/domain/Either";
import type { RequeueError } from "../operations/RequeueError";

export interface RequeuedJob { jobId: string; uploadId: string; }
export interface IDeadJobRequeue { requeue(uploadId: string, now: Date): Promise<Either<RequeueError, RequeuedJob>>; }
