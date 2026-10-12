export interface SecurityHeader { key: string; value: string; }
export function securityHeaders(apiBase: string, environment: string | undefined): SecurityHeader[] {
  let api: URL;
  try { api = new URL(apiBase); } catch { throw new Error("NEXT_PUBLIC_API_URL must be an HTTP(S) URL"); }
  if (!["http:", "https:"].includes(api.protocol) || api.username || api.password) throw new Error("NEXT_PUBLIC_API_URL must be an HTTP(S) URL without credentials");
  const development = environment === "development";
  const policy = ["default-src 'self'", `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self'", "object-src 'none'",
    "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
    `connect-src 'self' ${api.origin}${development ? " ws: wss:" : ""}`].join("; ");
  return [{ key: "Content-Security-Policy", value: policy }, { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }];
}
