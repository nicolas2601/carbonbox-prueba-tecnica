import type { PrismaClient, Job } from "../../../generated/prisma/client";
import { Upload } from "../../domain/entities/Upload";
import { FileName } from "../../domain/value-objects/FileName";
import { ActivityData } from "../../domain/entities/ActivityData";
import { PrismaUploadRepository } from "../persistence/PrismaUploadRepository";

export const NOW = new Date("2024-01-15T12:34:56.789Z");
export const VISIBILITY_MS = 1000;
export function upload(id = "u1"): Upload {
  const name = FileName.create("report.csv");
  if (name.isLeft()) throw name.value;
  return Upload.create({ id, fileName: name.value, fileUrl: `${id}.csv`, userId: "user", now: NOW });
}
export async function seedJob(client: PrismaClient, id = "u1", maxAttempts = 3): Promise<Job> {
  const result = await new PrismaUploadRepository(client, maxAttempts).saveWithJob(upload(id), { uploadId: id });
  if (result.isLeft()) throw result.value;
  return client.job.findUniqueOrThrow({ where: { uploadId: id } });
}
export function activity(id: string, uploadId = "u1"): ActivityData {
  const result = ActivityData.create({ id, uploadId, category: "Water", unit: "m3", amount: 10, date: NOW });
  if (result.isLeft()) throw result.value;
  return result.value;
}
