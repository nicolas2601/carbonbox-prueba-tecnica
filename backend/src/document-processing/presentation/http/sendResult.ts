import type { FastifyRequest, FastifyReply } from "fastify";
import type { Either } from "../../../shared/domain/Either";
import { sendError } from "./errorHandlers";

export function sendResult<T>(result: Either<Error, T>, request: FastifyRequest, reply: FastifyReply, status = 200): FastifyReply {
  return result.fold(error => sendError(request, reply, error), value => reply.code(status).send(value));
}
