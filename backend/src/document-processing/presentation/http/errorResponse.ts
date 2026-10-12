export interface ErrorEnvelope { error: { code: string; message: string; requestId?: string }; }
export interface ErrorResponse { status: number; body: ErrorEnvelope; }

const ERROR_STATUS: Readonly<Record<string, number>> = {
  INVALID_FILE_NAME: 400, INVALID_PAGINATION: 400, MISSING_FILE: 400, VALIDATION_ERROR: 400,
  UPLOAD_NOT_FOUND: 404, ROUTE_NOT_FOUND: 404, FILE_TOO_LARGE: 413, SERVICE_UNAVAILABLE: 503,
  RATE_LIMITED: 429,
};

export function statusForCode(code: string): number { return Object.hasOwn(ERROR_STATUS, code) ? ERROR_STATUS[code]! : 500; }
export function errorResponse(code: string, message: string, requestId: string): ErrorResponse {
  const status = statusForCode(code);
  if (status === 503) return { status, body: { error: { code, message: "Database unavailable", requestId } } };
  if (status >= 500) return { status, body: { error: { code: "INTERNAL_ERROR", message: "Internal server error", requestId } } };
  return { status, body: { error: { code, message } } };
}
