import type { CreateUploadCommandHandler } from "../../application/create-upload/CreateUploadCommandHandler";
import type { GetUploadByIdQueryHandler } from "../../application/queries/GetUploadByIdQueryHandler";
import type { GetUploadStatsQueryHandler } from "../../application/queries/GetUploadStatsQueryHandler";
import type { ListUploadsQueryHandler } from "../../application/queries/ListUploadsQueryHandler";
import type { GetUploadResultsQueryHandler } from "../../application/queries/GetUploadResultsQueryHandler";

export interface ApiServices {
  createUpload: Pick<CreateUploadCommandHandler, "execute">;
  getUploadById: Pick<GetUploadByIdQueryHandler, "execute">;
  getUploadStats: Pick<GetUploadStatsQueryHandler, "execute">;
  listUploads: Pick<ListUploadsQueryHandler, "execute">;
  getUploadResults: Pick<GetUploadResultsQueryHandler, "execute">;
  ready(): Promise<void>;
}
