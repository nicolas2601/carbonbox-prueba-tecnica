import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import type { Page, Pagination, UploadView } from "../../application/queries/models";
import { pageOffset } from "../../application/queries/validatePagination";

const UPLOAD_SELECT = { id: true, fileName: true, status: true, totalRows: true, processedRows: true,
  failedRows: true, errorMessage: true, createdAt: true, updatedAt: true } satisfies Prisma.UploadSelect;
type UploadRecord = Prisma.UploadGetPayload<{ select: typeof UPLOAD_SELECT }>;
function uploadView(row: UploadRecord): UploadView {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

export class PrismaUploadQueries {
  constructor(private readonly client: PrismaClient) {}
  async findById(id: string): Promise<UploadView | null> {
    const row = await this.client.upload.findUnique({ where: { id }, select: UPLOAD_SELECT });
    return row ? uploadView(row) : null;
  }
  async list(pagination: Pagination): Promise<Page<UploadView>> {
    const [rows, total] = await this.client.$transaction([
      this.client.upload.findMany({ select: UPLOAD_SELECT, orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: pageOffset(pagination), take: pagination.limit }),
      this.client.upload.count(),
    ]);
    return { data: rows.map(uploadView), total, ...pagination };
  }
}
