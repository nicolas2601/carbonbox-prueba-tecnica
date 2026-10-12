export interface CreateUploadCommand {
  fileName: string;
  stream: AsyncIterable<Uint8Array>;
  userId: string;
}

export interface CreateUploadResult {
  id: string;
  status: "PENDING";
  fileName: string;
  createdAt: Date;
}
