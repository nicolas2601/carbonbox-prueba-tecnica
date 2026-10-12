import { Prisma, type PrismaClient } from "../../../generated/prisma/client";
import { Either } from "../../../shared/domain/Either";
import type { Upload } from "../../domain/entities/Upload";
import type { IUploadRepository } from "../../application/ports/IUploadRepository";
import type { ProcessFileJob } from "../../application/ports/ProcessFileJob";
import { UploadPersistenceError } from "../../application/create-upload/UploadPersistenceError";

export class PrismaUploadRepository implements IUploadRepository {
  constructor(private readonly client: PrismaClient, private readonly maxAttempts: number) {}
  async saveWithJob(upload: Upload, job: ProcessFileJob): Promise<Either<UploadPersistenceError, void>> {
    try {
      await this.client.$transaction(async tx => {
        await tx.upload.create({ data: {
          id: upload.id, fileName: upload.fileName.value, fileUrl: upload.fileUrl, userId: upload.userId,
          status: upload.status, totalRows: upload.totalRows, processedRows: upload.processedRows,
          failedRows: upload.failedRows, errorMessage: upload.errorMessage,
          createdAt: upload.createdAt, updatedAt: upload.updatedAt,
        } });
        await tx.job.create({ data: { uploadId: job.uploadId, maxAttempts: this.maxAttempts, availableAt: upload.createdAt } });
      });
      return Either.right(undefined);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return Either.left(new UploadPersistenceError("An upload or job with this id already exists"));
      }
      throw error;
    }
  }
}
