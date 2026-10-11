import type { PrismaClient } from "../../../generated/prisma/client";
import { Upload } from "../../domain/entities/Upload";
import { FileName } from "../../domain/value-objects/FileName";
import { UploadStatus } from "../../domain/value-objects/UploadStatus";
import type { IUploadReader } from "../../application/ports/IUploadReader";

export class PrismaUploadReader implements IUploadReader {
  constructor(private readonly client: PrismaClient) {}
  async findById(id: string): Promise<Upload | null> {
    const row = await this.client.upload.findUnique({ where: { id } });
    if (!row) return null;
    const fileName = FileName.create(row.fileName);
    if (fileName.isLeft()) throw fileName.value;
    const status = UploadStatus.create(row.status);
    if (status.isLeft()) throw status.value;
    return Upload.reconstitute({ ...row, fileName: fileName.value, status: status.value.value });
  }
}
