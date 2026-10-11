import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { DomainError } from "../../../shared/domain/DomainError";
import { errorResponse } from "./errorResponse";
import { redactSecrets } from "./redactSecrets";

function redactedCause(cause: unknown): unknown {
  if (typeof cause === "string") return redactSecrets(cause);
  if (!(cause instanceof Error)) return { type: "NonError" };
  return {
    type: cause.name,
    message: redactSecrets(cause.message),
    stack: redactSecrets(cause.stack ?? ""),
  };
}

export function sendError(request: FastifyRequest, reply: FastifyReply, cause: unknown,
  code = cause instanceof DomainError ? cause.code : "INTERNAL_ERROR", message = cause instanceof Error ? cause.message : "Internal server error"): FastifyReply {
  const response = errorResponse(code, message, request.id);
  if (response.status >= 500) request.log.error({ err: redactedCause(cause), requestId: request.id }, "API request failed");
  return reply.code(response.status).send(response.body);
}

export function registerErrorHandlers(server: FastifyInstance): void {
  server.setErrorHandler<FastifyError>((error, request, reply) => {
    if (error.validation) {
      const field = error.validation[0]?.instancePath || error.validationContext || "input";
      return sendError(request, reply, error, "VALIDATION_ERROR", `Invalid request parameter: ${field}`);
    }
    if (error.statusCode === 413) return sendError(request, reply, error, "FILE_TOO_LARGE", "File exceeds the configured size limit");
    if (!(error instanceof DomainError) && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return sendError(request, reply, error, "VALIDATION_ERROR", "Invalid request");
    }
    return sendError(request, reply, error);
  });
  server.setNotFoundHandler((request, reply) => sendError(request, reply, undefined, "ROUTE_NOT_FOUND", "Route not found"));
}
