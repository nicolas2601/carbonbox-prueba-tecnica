import { Either } from "../../../shared/domain/Either";
import type { IUploadQueries } from "../ports/IUploadQueries";
import type { UploadStats } from "./models";

export class GetUploadStatsQueryHandler {
  constructor(private readonly queries: IUploadQueries) {}
  async execute(): Promise<Either<Error, UploadStats>> { return Either.right(await this.queries.stats()); }
}
