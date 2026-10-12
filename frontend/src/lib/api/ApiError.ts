import axios from "axios";

export class ApiError extends Error {
  constructor(readonly code: string, message: string, readonly status: number, readonly requestId?: string) {
    super(message);
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeApiError(cause: unknown): ApiError {
  if (cause instanceof ApiError) return cause;
  if (axios.isCancel(cause)) return new ApiError("CANCELLED", "Upload canceled", 0);
  if (!axios.isAxiosError<unknown>(cause)) return new ApiError("UNEXPECTED_ERROR", "Something went wrong. Please try again.", 0);
  if (!cause.response) return new ApiError("NETWORK_ERROR", "Cannot reach the server. Check your connection and try again.", 0);
  const { data, status } = cause.response;
  const error = isRecord(data) && isRecord(data.error) ? data.error : undefined;
  if (error && typeof error.code === "string" && typeof error.message === "string") {
    return new ApiError(error.code, error.message, status, typeof error.requestId === "string" ? error.requestId : undefined);
  }
  return new ApiError("HTTP_ERROR", `Request failed (${status}). Please try again.`, status);
}
