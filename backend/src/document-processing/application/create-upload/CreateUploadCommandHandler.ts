import { Either } from "../../../shared/domain/Either";
import { FileName } from "../../domain/value-objects/FileName";
import { Upload } from "../../domain/entities/Upload";
import type { IFileStorage } from "../ports/IFileStorage";
import type { IUploadRepository } from "../ports/IUploadRepository";
import type { IIdGenerator } from "../ports/IIdGenerator";
import type { IClock } from "../ports/IClock";
import type { CreateUploadCommand, CreateUploadResult } from "./CreateUploadCommand";

export class CreateUploadCommandHandler {
  constructor(private readonly storage: IFileStorage, private readonly repository: IUploadRepository,
    private readonly ids: IIdGenerator, private readonly clock: IClock) {}

  async execute(command: CreateUploadCommand): Promise<Either<Error, CreateUploadResult>> {
    const name = FileName.create(command.fileName);
    if (name.isLeft()) return Either.left(name.value);
    const stored = await this.storage.save(command.stream);
    if (stored.isLeft()) return Either.left(stored.value);
    const upload = Upload.create({ id: this.ids.next(), fileName: name.value, fileUrl: stored.value,
      userId: command.userId, now: this.clock.now() });
    const saved = await this.repository.saveWithJob(upload, { uploadId: upload.id });
    if (saved.isLeft()) {
      await this.storage.delete(stored.value);
      return Either.left(saved.value);
    }
    return Either.right({ id: upload.id, status: "PENDING", fileName: upload.fileName.value, createdAt: upload.createdAt });
  }
}
