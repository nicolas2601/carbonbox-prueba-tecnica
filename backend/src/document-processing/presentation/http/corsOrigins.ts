const INVALID_ORIGIN = new Error("CORS_ORIGIN must list HTTP(S) origins without paths or credentials");
export function corsOrigins(value: string): string[] {
  return [...new Set(value.split(",").map(entry => {
    let url: URL;
    try { url = new URL(entry.trim()); } catch { throw INVALID_ORIGIN; }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw INVALID_ORIGIN;
    return url.origin;
  }))];
}
