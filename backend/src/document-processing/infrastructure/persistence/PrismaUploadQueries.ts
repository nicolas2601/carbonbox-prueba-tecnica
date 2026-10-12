import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import type { Page, Pagination, ResultRow, UploadListQuery, UploadView, UploadStats } from "../../application/queries/models";
import type { IUploadQueries } from "../../application/ports/IUploadQueries";
import { pageOffset } from "../../application/queries/validatePagination";

const UPLOAD_SELECT = { id: true, fileName: true, status: true, totalRows: true, processedRows: true,
  failedRows: true, errorMessage: true, createdAt: true, updatedAt: true } satisfies Prisma.UploadSelect;
type UploadRecord = Prisma.UploadGetPayload<{ select: typeof UPLOAD_SELECT }>;
function uploadView(row: UploadRecord): UploadView {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}
function escapeLikeLiteral(value: string): string { return value.replace(/[\\%_]/gu, "\\$&"); }
function uploadOrder(sort: UploadListQuery["sort"]): Prisma.UploadOrderByWithRelationInput[] {
  if (sort === "oldest") return [{ createdAt: "asc" }, { id: "asc" }];
  if (sort === "name") return [{ fileName: "asc" }, { id: "asc" }];
  return [{ createdAt: "desc" }, { id: "asc" }];
}

export class PrismaUploadQueries implements IUploadQueries {
  constructor(private readonly client: PrismaClient) {}
  async findById(id: string): Promise<UploadView | null> {
    const row = await this.client.upload.findUnique({ where: { id }, select: UPLOAD_SELECT });
    return row ? uploadView(row) : null;
  }
  async list(query: UploadListQuery): Promise<Page<UploadView>> {
    const where: Prisma.UploadWhereInput = {
      ...(query.q ? { fileName: { contains: escapeLikeLiteral(query.q), mode: "insensitive" } } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const pagination = { page: query.page, limit: query.limit };
    const [rows, total] = await this.client.$transaction([
      this.client.upload.findMany({ where, select: UPLOAD_SELECT, orderBy: uploadOrder(query.sort),
        skip: pageOffset(pagination), take: pagination.limit }),
      this.client.upload.count({ where }),
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
    const groups = await this.client.upload.groupBy({ by: ["status"], _count: { _all: true },
      _sum: { processedRows: true, failedRows: true } });
    const stats: UploadStats = { total: 0, completed: 0, inProgress: 0, failed: 0,
      pending: 0, processing: 0, processedRows: 0, rejectedRows: 0 };
    for (const group of groups) {
      const count = group._count._all;
      stats.total += count;
      stats.processedRows += group._sum.processedRows ?? 0;
      stats.rejectedRows += group._sum.failedRows ?? 0;
      if (group.status === "COMPLETED") stats.completed += count;
      if (group.status === "FAILED") stats.failed += count;
      if (group.status === "PENDING") stats.pending += count;
      if (group.status === "PROCESSING") stats.processing += count;
    }
    stats.inProgress = stats.pending + stats.processing;
    return stats;
  }
}
