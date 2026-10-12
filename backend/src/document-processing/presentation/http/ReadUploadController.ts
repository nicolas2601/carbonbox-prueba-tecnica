import type { FastifyRequest, FastifyReply } from "fastify";
import type { ApiServices } from "./ApiServices";
import { sendResult } from "./sendResult";
import type { PaginationRequest, UploadListRequest } from "../../application/queries/models";

export class ReadUploadController {
  constructor(private readonly services: ApiServices) {}
  async stats(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    return sendResult(await this.services.getUploadStats.execute(), request, reply);
  }
  async byId(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<FastifyReply> {
    return sendResult(await this.services.getUploadById.execute({ uploadId: request.params.id }), request, reply);
  }
  async list(request: FastifyRequest<{ Querystring: UploadListRequest }>, reply: FastifyReply): Promise<FastifyReply> {
    return sendResult(await this.services.listUploads.execute(request.query), request, reply);
  }
  async results(request: FastifyRequest<{ Params: { id: string }; Querystring: PaginationRequest }>, reply: FastifyReply): Promise<FastifyReply> {
    return sendResult(await this.services.getUploadResults.execute({ ...request.query, uploadId: request.params.id }), request, reply);
  }
}
