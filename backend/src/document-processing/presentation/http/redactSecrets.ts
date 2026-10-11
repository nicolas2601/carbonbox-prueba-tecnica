export const HTTP_LOG_REDACTION = ["req.headers.authorization", "req.headers.cookie"];

export function redactSecrets(text: string): string {
  return text.replace(/(\b[a-z][a-z\d+.-]*:\/\/)[^/\s@]+@/gi, "$1***@");
}
