import type { FastifyRequest, FastifyReply } from "fastify";
import type { ApiServices } from "./ApiServices";
import { sendResult } from "./sendResult";

export class ReadUploadController {
  constructor(private readonly services: ApiServices) {}
  async stats(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    return sendResult(await this.services.getUploadStats.execute(), request, reply);
  }
  async byId(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<FastifyReply> {
    return sendResult(await this.services.getUploadById.execute({ uploadId: request.params.id }), request, reply);
  }
}
