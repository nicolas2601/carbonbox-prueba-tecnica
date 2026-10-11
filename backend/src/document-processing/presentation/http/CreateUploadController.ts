import type { FastifyRequest, FastifyReply } from "fastify";
import type { UploadEndpoint } from "./UploadEndpoint";
import { sendResult } from "./sendResult";

export class CreateUploadController {
  constructor(private readonly endpoint: UploadEndpoint) {}
  async create(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    return sendResult(await this.endpoint.execute(request), request, reply, 201, value => `/api/v1/uploads/${encodeURIComponent(value.id)}`);
  }
}
