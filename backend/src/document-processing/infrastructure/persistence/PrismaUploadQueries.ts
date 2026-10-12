import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import type { Page, Pagination, ResultRow, UploadView, UploadStats } from "../../application/queries/models";
import type { IUploadQueries } from "../../application/ports/IUploadQueries";
import { pageOffset } from "../../application/queries/validatePagination";

const UPLOAD_SELECT = { id: true, fileName: true, status: true, totalRows: true, processedRows: true,
  failedRows: true, errorMessage: true, createdAt: true, updatedAt: true } satisfies Prisma.UploadSelect;
type UploadRecord = Prisma.UploadGetPayload<{ select: typeof UPLOAD_SELECT }>;
function uploadView(row: UploadRecord): UploadView {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

export class PrismaUploadQueries implements IUploadQueries {
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
  async results(uploadId: string, pagination: Pagination): Promise<Page<ResultRow>> {
    const where = { uploadId };
    const [rows, total] = await this.client.$transaction([
      this.client.activityData.findMany({ where, select: { category: true, amount: true, unit: true, date: true },
        orderBy: [{ date: "asc" }, { id: "asc" }], skip: pageOffset(pagination), take: pagination.limit }),
      this.client.activityData.count({ where }),
    ]);
    return { data: rows.map(row => ({ ...row, date: row.date.toISOString().slice(0, 10) })), total, ...pagination };
  }
  async stats(): Promise<UploadStats> {
    const groups = await this.client.upload.groupBy({ by: ["status"], _count: { _all: true } });
    const stats: UploadStats = { total: 0, completed: 0, inProgress: 0, failed: 0 };
    for (const group of groups) {
      const count = group._count._all;
      stats.total += count;
      if (group.status === "COMPLETED") stats.completed += count;
      if (group.status === "FAILED") stats.failed += count;
      if (group.status === "PENDING" || group.status === "PROCESSING") stats.inProgress += count;
    }
    return stats;
  }
}
